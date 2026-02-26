class Api::V1::AuthController < ApplicationController
  skip_before_action :authenticate_request, only: [:login, :register, :forgot_password, :reset_password, :contact_admin]
  skip_before_action :check_authorization, only: [:login, :register, :forgot_password, :reset_password, :contact_admin, :logout, :refresh_token]
  skip_before_action :update_user_activity, only: [:login, :register, :forgot_password, :reset_password, :contact_admin]

  def logout
    @current_user&.increment!(:token_version)
    render json: { message: 'Logged out successfully' }
  end

  def refresh_token
    token = JsonWebToken.encode(user_id: @current_user.id)
    render json: { token: token }
  end

  def login
    # Rate limit: 5 attempts per IP per 10 minutes
    return if rate_limited?("login:#{request.remote_ip}", 5)

    email    = params[:email] || params.dig(:auth, :email)
    password = params[:password] || params.dig(:auth, :password)

    user = User.find_by(email: email&.downcase&.strip)

    unless user
      render json: { error: 'Invalid credentials' }, status: :unauthorized
      return
    end

    # Account lockout check
    if user.locked?
      minutes_left = ((user.locked_at + 30.minutes - Time.current) / 60).ceil
      render json: { error: "Account locked after too many failed attempts. Try again in #{minutes_left} minute(s)." }, status: :forbidden
      return
    end

    if user.authenticate(password)
      if user.status == 'inactive'
        render json: { error: 'Your account has been deactivated. Please contact your administrator.' }, status: :forbidden
        return
      end
      user.reset_failed!
      user.update_columns(last_activity_at: Time.current, login_count: (user.login_count || 0) + 1)
      token = JsonWebToken.encode(user_id: user.id)
      render json: {
        user: {
          id:         user.id,
          email:      user.email,
          first_name: user.first_name,
          last_name:  user.last_name,
          name:       "#{user.first_name} #{user.last_name}",
          role:       user.role,
          avatar:     user.avatar
        },
        token: token
      }
    else
      user.increment_failed!
      attempts_left = [5 - (user.failed_login_attempts || 0), 0].max
      msg = attempts_left > 0 ? "Invalid credentials. #{attempts_left} attempt(s) remaining before lockout." : 'Account locked due to too many failed attempts.'
      render json: { error: msg }, status: :unauthorized
    end
  end

  def register
    user_params = params.permit(:first_name, :last_name, :email, :password, :confirm_password)

    if User.exists?(email: user_params[:email])
      render json: { error: 'Email already exists' }, status: :unprocessable_entity
      return
    end

    user = User.new(
      first_name:  user_params[:first_name],
      last_name:   user_params[:last_name],
      email:       user_params[:email],
      password:    user_params[:password],
      role:        'admin',
      status:      'active',
      joined_date: Date.current
    )

    if user.save
      token = JsonWebToken.encode(user_id: user.id)
      render json: {
        user: {
          id:         user.id,
          email:      user.email,
          first_name: user.first_name,
          last_name:  user.last_name,
          name:       "#{user.first_name} #{user.last_name}",
          role:       user.role
        },
        token: token
      }
    else
      render json: { error: 'Registration failed' }, status: :unprocessable_entity
    end
  end

  def change_password
    current_password = params[:current_password]
    new_password     = params[:new_password]

    if @current_user.authenticate(current_password)
      if @current_user.update(password: new_password)
        render json: { message: 'Password updated successfully' }
      else
        render json: { error: 'Failed to update password' }, status: :unprocessable_entity
      end
    else
      render json: { error: 'Current password is incorrect' }, status: :unauthorized
    end
  end

  def forgot_password
    # Rate limit: 3 attempts per IP per 10 minutes
    return if rate_limited?("forgot:#{request.remote_ip}", 3)

    email = params[:email]
    user  = User.find_by(email: email&.downcase&.strip)

    unless user
      # Don't reveal whether the email exists
      render json: { message: 'If that email is registered, an OTP has been sent.' }
      return
    end

    otp = rand(100000..999999).to_s
    user.update(otp_code: otp, otp_expires_at: 10.minutes.from_now)
    UserMailer.otp_email(user, otp).deliver_now

    render json: { message: 'OTP sent to your email address' }
  end

  def reset_password
    email            = params[:email]
    otp              = params[:otp]
    new_password     = params[:new_password]
    confirm_password = params[:confirm_password]

    user = User.find_by(email: email)

    unless user
      render json: { error: 'No account found with that email address' }, status: :not_found
      return
    end

    if user.otp_code.blank? || user.otp_expires_at.blank?
      render json: { error: 'No OTP requested. Please request a new OTP.' }, status: :unprocessable_entity
      return
    end

    if Time.current > user.otp_expires_at
      render json: { error: 'OTP has expired. Please request a new one.' }, status: :unprocessable_entity
      return
    end

    if user.otp_code != otp
      render json: { error: 'Invalid OTP. Please check and try again.' }, status: :unprocessable_entity
      return
    end

    if new_password != confirm_password
      render json: { error: 'Passwords do not match.' }, status: :unprocessable_entity
      return
    end

    if new_password.length < 6
      render json: { error: 'Password must be at least 6 characters.' }, status: :unprocessable_entity
      return
    end

    if user.update(password: new_password, otp_code: nil, otp_expires_at: nil)
      render json: { message: 'Password reset successfully. You can now sign in.' }
    else
      render json: { error: 'Failed to reset password.' }, status: :unprocessable_entity
    end
  end

  def contact_admin
    name    = params[:name].to_s.strip
    email   = params[:email].to_s.strip
    message = params[:message].to_s.strip

    if name.blank? || email.blank? || message.blank?
      render json: { error: 'Name, email and message are required.' }, status: :unprocessable_entity
      return
    end

    UserMailer.contact_admin_email(name, email, message, 'qaplatform67@gmail.com').deliver_now
    render json: { message: 'Your message has been sent to the administrator.' }
  end

  private

  # Returns true and renders 429 if rate limit exceeded; false otherwise.
  def rate_limited?(cache_key, limit)
    count = Rails.cache.increment(cache_key, 1, expires_in: 10.minutes)
    if count > limit
      render json: { error: 'Too many attempts. Please try again in 10 minutes.' }, status: :too_many_requests
      return true
    end
    false
  end
end

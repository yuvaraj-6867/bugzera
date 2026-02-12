class Api::V1::AuthController < ApplicationController
  skip_before_action :authenticate_request, only: [:login, :register]
  skip_before_action :check_authorization, only: [:login, :register]
  skip_before_action :update_user_activity, only: [:login, :register]
  def login
    email = params[:email] || params.dig(:auth, :email)
    password = params[:password] || params.dig(:auth, :password)
    
    user = User.find_by(email: email)
    if user && user.authenticate(password)
      # Update last activity to mark as active
      user.update(last_activity_at: Time.current)
      
      token = JsonWebToken.encode(user_id: user.id)
      
      render json: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          name: "#{user.first_name} #{user.last_name}",
          role: user.role
        },
        token: token
      }
    else
      render json: { error: 'Invalid credentials' }, status: :unauthorized
    end
  end

  def register
    user_params = params.permit(:first_name, :last_name, :email, :password, :confirm_password)
    
    if User.exists?(email: user_params[:email])
      render json: { error: 'Email already exists' }, status: :unprocessable_entity
      return
    end
    
    user = User.new(
      first_name: user_params[:first_name],
      last_name: user_params[:last_name], 
      email: user_params[:email],
      password: user_params[:password],
      role: 'admin',
      status: 'active',
      joined_date: Date.current
    )
    
    if user.save
      token = JsonWebToken.encode(user_id: user.id)
      render json: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          name: "#{user.first_name} #{user.last_name}",
          role: user.role
        },
        token: token
      }
    else
      render json: { error: 'Registration failed' }, status: :unprocessable_entity
    end
  end

  def change_password
    current_password = params[:current_password]
    new_password = params[:new_password]
    
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
end
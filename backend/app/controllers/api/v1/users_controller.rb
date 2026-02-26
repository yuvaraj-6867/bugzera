class Api::V1::UsersController < ApplicationController
  before_action :set_cors_headers

  def current
    # Extract user ID from token (fake_token_1, fake_token_2, etc.)
    token = request.headers['Authorization']&.gsub('Bearer ', '')
    user_id = token&.match(/fake_token_(\d+)/)&.[](1)

    user = user_id ? User.find_by(id: user_id) : current_user

    if user
      render json: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar
      }
    else
      render json: { error: 'No users found' }, status: :not_found
    end
  rescue => e
    render json: { error: e.message }, status: :internal_server_error
  end

  def update_avatar
    avatar_data = params[:avatar]

    if avatar_data.present? && !avatar_data.start_with?('data:image/')
      render json: { error: 'Invalid image format' }, status: :unprocessable_entity
      return
    end

    if @current_user.update(avatar: avatar_data.presence)
      render json: { avatar: @current_user.avatar, message: 'Profile photo updated' }
    else
      render json: { error: 'Failed to update avatar' }, status: :unprocessable_entity
    end
  end

  def index
    users = User.all
    Rails.logger.info "Found #{users.count} users"
    render json: { data: users.map { |user| {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      name: "#{user.first_name} #{user.last_name}",
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      location: user.location,
      joined_date: user.joined_date,
      created_at: user.created_at,
      last_activity_at: user.last_activity_at
    }}}
  end

  def show
    user = User.find(params[:id])
    render json: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      location: user.location,
      joined_date: user.joined_date,
      created_at: user.created_at
    }
  end

  def create
    user = User.new(user_params)
    # Generate random password
    generated_password = generate_password
    user.password = generated_password
    
    if user.save
      # Send welcome email invitation with password
      UserMailer.welcome_email(user, generated_password).deliver_now
      render json: { message: 'User created successfully and invitation sent', user: user }, status: :created
    else
      render json: { errors: user.errors }, status: :unprocessable_content
    end
  end

  def update
    user = User.find(params[:id])
    if user.update(user_params)
      render json: { message: 'User updated successfully' }
    else
      render json: { errors: user.errors }, status: :unprocessable_content
    end
  end

  def destroy
    user = User.find(params[:id])
    user.destroy
    render json: { message: 'User deleted successfully' }
  end

  def deactivate
    user = User.find(params[:id])
    if user.update(status: 'inactive')
      render json: { message: 'User deactivated', status: 'inactive' }
    else
      render json: { errors: user.errors }, status: :unprocessable_entity
    end
  end

  def activate
    user = User.find(params[:id])
    if user.update(status: 'active')
      render json: { message: 'User activated', status: 'active' }
    else
      render json: { errors: user.errors }, status: :unprocessable_entity
    end
  end

  def invite
    email = params[:email].to_s.strip.downcase
    role  = params[:role].presence || 'member'

    if email.blank?
      render json: { error: 'Email is required' }, status: :unprocessable_entity
      return
    end

    if User.exists?(email: email)
      render json: { error: 'User with this email already exists' }, status: :unprocessable_entity
      return
    end

    first_name = params[:first_name].presence || 'Invited'
    last_name  = params[:last_name].presence  || 'User'
    generated_password = generate_password

    user = User.new(
      first_name: first_name,
      last_name: last_name,
      email: email,
      password: generated_password,
      role: role,
      status: 'active',
      joined_date: Date.current
    )

    if user.save
      UserMailer.welcome_email(user, generated_password).deliver_now rescue nil
      render json: { message: 'Invitation sent', user: { id: user.id, email: user.email, role: user.role } }, status: :created
    else
      render json: { errors: user.errors }, status: :unprocessable_entity
    end
  end

  def activity
    user = User.find(params[:id])
    activities = Activity.where(user_id: user.id).order(created_at: :desc).limit(50) rescue []
    render json: { activities: activities }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'User not found' }, status: :not_found
  end

  def password
    user = User.find(params[:id])
    new_password = params[:password] || params[:new_password]

    if new_password.blank? || new_password.length < 6
      render json: { error: 'Password must be at least 6 characters' }, status: :unprocessable_entity
      return
    end

    if user.update(password: new_password)
      render json: { message: 'Password updated successfully' }
    else
      render json: { errors: user.errors }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'User not found' }, status: :not_found
  end

  private

  def user_params
    params.require(:user).permit(:first_name, :last_name, :email, :role, :status, :phone, :location, :joined_date)
  end

  def generate_password
    # Generate 8 character password with first letter capitalized, symbols and numbers
    chars = ('a'..'z').to_a + ('0'..'9').to_a + ['!', '@', '#', '$', '%', '&', '*']
    password = ''
    
    # First character - capitalized letter
    password += ('A'..'Z').to_a.sample
    
    # Ensure at least one number and one symbol
    password += ('0'..'9').to_a.sample
    password += ['!', '@', '#', '$', '%', '&', '*'].sample
    
    # Fill remaining 5 characters randomly
    5.times { password += chars.sample }
    
    # Shuffle the password (except first character)
    first_char = password[0]
    remaining = password[1..-1].chars.shuffle.join
    first_char + remaining
  end

  def set_cors_headers
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
  end
end
class ApplicationController < ActionController::API
  before_action :authenticate_request
  before_action :check_authorization
  before_action :update_user_activity

  def authenticate_request
    return if request.method == 'OPTIONS'
    return if skip_authentication?
    
    header = request.headers['Authorization']
    header = header.split(' ').last if header
    
    if header.blank?
      render json: { error: 'No authorization token provided' }, status: :unauthorized
      return
    end
    
    begin
      decoded = JsonWebToken.decode(header)
      @current_user = User.find(decoded[:user_id])
    rescue ActiveRecord::RecordNotFound => e
      render json: { error: 'User not found' }, status: :unauthorized
    rescue JWT::DecodeError => e
      render json: { error: 'Invalid token' }, status: :unauthorized
    rescue => e
      render json: { error: 'Authentication failed' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def check_authorization
    return if request.method == 'OPTIONS'
    return render json: { error: 'Unauthorized' }, status: :forbidden unless authorized?
  end

  def authorized?
    return false unless current_user
    return true if current_user.admin?
    
    feature = controller_to_feature(controller_name)
    return true unless feature
    
    current_user.can_access?(feature)
  end

  private

  def controller_to_feature(controller)
    mapping = {
      'dashboard' => 'dashboard',
      'test_cases' => 'test-cases',
      'automation_scripts' => 'automation',
      'tickets' => 'tickets',
      'documents' => 'documents',
      'document_imports' => 'documents',
      'sprints' => 'dashboard',
      'analytics' => 'analytics',
      'users' => 'dashboard',
      'user_invitations' => 'users',
      'video_analyses' => 'video-analysis',
      'settings' => 'dashboard'
    }
    mapping[controller]
  end

  def update_user_activity
    return if request.method == 'OPTIONS'
    return unless current_user
    
    current_user.update_column(:last_activity_at, Time.current)
  end

  def skip_authentication?
    false
  end
end

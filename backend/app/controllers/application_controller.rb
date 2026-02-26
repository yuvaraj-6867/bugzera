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

  # Pagination helper: returns { page, per_page, total, pages } and scoped relation
  def paginate(scope)
    page     = [params.fetch(:page, 1).to_i, 1].max
    per_page = [[params.fetch(:per_page, 25).to_i, 1].max, 200].min
    total    = scope.count
    pages    = (total.to_f / per_page).ceil
    [scope.offset((page - 1) * per_page).limit(per_page),
     { total: total, page: page, per_page: per_page, pages: pages }]
  end

  private

  def controller_to_feature(controller)
    mapping = {
      'dashboard' => 'dashboard',
      'projects' => 'projects',
      'test_cases' => 'test-cases',
      'test_case_attachments' => 'test-cases',
      'automation_scripts' => 'automation',
      'tickets' => 'tickets',
      'documents' => 'documents',
      'document_imports' => 'documents',
      'sprints' => 'sprints',
      'environments' => 'environments',
      'test_data_sets' => 'test-data',
      'calendar_events' => 'calendar',
      'articles' => 'knowledge-base',
      'integrations' => 'integrations',
      'analytics' => 'analytics',
      'activities' => 'dashboard',
      'audit_logs' => 'settings',
      'ticket_relationships' => 'tickets',
      'users' => 'users',
      'user_invitations' => 'users',
      'test_runs' => 'test-cases',
      'test_plans' => 'test-cases',
      'video_analyses' => 'video-analysis',
      'settings' => 'settings'
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

module ProjectAuthorization
  extend ActiveSupport::Concern

  private

  def check_project_access(project_id, required_role = 'viewer')
    return true if current_user.admin? # System admin has access to all projects
    
    project_user = ProjectUser.find_by(project_id: project_id, user_id: current_user.id)
    return false unless project_user
    
    case required_role
    when 'admin'
      project_user.role == 'admin'
    when 'member'
      %w[admin member].include?(project_user.role)
    when 'viewer'
      %w[admin member viewer].include?(project_user.role)
    else
      false
    end
  end

  def require_project_access(project_id, required_role = 'viewer')
    unless check_project_access(project_id, required_role)
      render json: { error: 'Access denied to this project' }, status: :forbidden
      return false
    end
    true
  end
end
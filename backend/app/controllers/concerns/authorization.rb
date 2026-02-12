module Authorization
  extend ActiveSupport::Concern

  included do
    before_action :check_authorization
  end

  private

  def check_authorization
    return render json: { error: 'Unauthorized' }, status: :forbidden unless authorized?
  end

  def authorized?
    case action_name
    when 'index', 'show'
      can_read?
    when 'create', 'new'
      can_create?
    when 'update', 'edit'
      can_update?
    when 'destroy'
      can_delete?
    else
      true
    end
  end

  def can_read?
    case controller_name
    when 'users'
      current_user.admin?
    when 'test_cases', 'tickets', 'dashboard', 'documents'
      %w[admin  qa_manager].include?(current_user.role)
    when 'analytics'
      %w[admin qa_manager].include?(current_user.role)
    else
      true
    end
  end

  def can_create?
    case controller_name
    when 'users'
      current_user.admin?
    when 'test_cases'
      %w[admin qa_manager].include?(current_user.role)
    when 'tickets'
      %w[admin qa_manager].include?(current_user.role)
    when 'user_invitations'
      %w[admin qa_manager].include?(current_user.role)
    else
      can_read?
    end
  end

  def can_update?
    case controller_name
    when 'users'
      current_user.admin?
    when 'test_cases'
      %w[admin qa_manager].include?(current_user.role)
    when 'tickets'
      %w[admin qa_manager].include?(current_user.role)
    else
      can_read?
    end
  end

  def can_delete?
    case controller_name
    when 'users'
      current_user.admin?
    when 'test_cases'
      current_user.admin?
    when 'tickets'
      %w[admin qa_manager].include?(current_user.role)
    else
      false
    end
  end
end

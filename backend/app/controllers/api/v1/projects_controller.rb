class Api::V1::ProjectsController < ApplicationController
  skip_before_action :authenticate_request, :check_authorization

  def index
    # If admin, show all projects
    if current_user&.admin?
      projects = Project.all
    elsif current_user
      # Show only projects user has access to
      projects = current_user.accessible_projects
    else
      # If no current_user (auth disabled), show all projects
      projects = Project.all
    end

    render json: {
      projects: projects.map { |project| {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        created_at: project.created_at
      }}
    }
  end

  def create
    Rails.logger.info "Project params received: #{params.inspect}"
    Rails.logger.info "Permitted params: #{project_params.inspect}"
    project = Project.new(project_params)
    if project.save
      render json: { id: project.id, name: project.name, status: project.status }, status: :created
    else
      render json: { errors: project.errors }, status: :unprocessable_content
    end
  end

  def show
    project = Project.find(params[:id])
    render json: {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      repository_url: project.repository_url,
      default_branch: project.default_branch,
      test_timeout: project.test_timeout,
      retry_failed_tests: project.retry_failed_tests,
      parallel_execution: project.parallel_execution,
      email_notifications: project.email_notifications,
      webhook_url: project.webhook_url,
      created_at: project.created_at
    }
  end

  def update
    project = Project.find(params[:id])
    if project.update(project_params)
      render json: { id: project.id, name: project.name, status: project.status }
    else
      render json: { errors: project.errors }, status: :unprocessable_content
    end
  end

  def destroy
    project = Project.find(params[:id])
    project.destroy
    render json: { message: 'Project deleted successfully' }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Project not found' }, status: :not_found
  end

  def users
    project = Project.find(params[:id])
    project_users = project.project_users.includes(:user)
    render json: {
      users: project_users.map do |pu|
        {
          id: pu.id,
          user_id: pu.user_id,
          role: pu.role,
          user: {
            id: pu.user.id,
            first_name: pu.user.first_name,
            last_name: pu.user.last_name,
            email: pu.user.email
          }
        }
      end
    }
  end

  def add_user
    project = Project.find(params[:id])
    project_user = project.project_users.build(
      user_id: params[:user_id],
      role: params[:role] || 'member'
    )
    
    if project_user.save
      render json: { message: 'User added successfully' }, status: :created
    else
      render json: { errors: project_user.errors }, status: :unprocessable_content
    end
  end

  def remove_user
    project = Project.find(params[:id])
    project_user = project.project_users.find_by(user_id: params[:user_id])
    
    if project_user&.destroy
      render json: { message: 'User removed successfully' }
    else
      render json: { error: 'User not found' }, status: :not_found
    end
  end

  def test_cases
    project = Project.find(params[:id])
    test_cases = project.test_cases.includes(:assigned_user, :created_by)
    
    render json: {
      test_cases: test_cases.map do |tc|
        {
          id: tc.id,
          title: tc.title,
          status: tc.status,
          assigned_user: tc.assigned_user ? "#{tc.assigned_user.first_name} #{tc.assigned_user.last_name}" : 'Unassigned',
          created_at: tc.created_at
        }
      end
    }
  end

  private

  def project_params
    params.require(:project).permit(:name, :description, :status, :repository_url, :default_branch, :test_timeout, :retry_failed_tests, :parallel_execution, :email_notifications, :webhook_url)
  end
end
class Api::V1::TestCasesController < ApplicationController
  include ProjectAuthorization

  def index
    test_cases = TestCase.includes(:assigned_user, :created_by, :project)

    # Apply project access control only for non-admin users (skip if no current_user)
    if current_user && !current_user.admin?
      accessible_project_ids = current_user.projects.pluck(:id)
      test_cases = test_cases.where(project_id: accessible_project_ids)
    end

    # Filter by project_id if provided
    if params[:project_id].present?
      test_cases = test_cases.where(project_id: params[:project_id])
    end
    render json: {
      test_cases: test_cases.map { |tc| {
        id: tc.id,
        title: tc.title,
        description: tc.description,
        steps: tc.steps,
        expected_results: tc.expected_results,
        status: tc.status,
        project_id: tc.project_id,
        project_name: tc.project&.name || 'No Project',
        assigned_user: tc.assigned_user ? "#{tc.assigned_user.first_name} #{tc.assigned_user.last_name}" : 'Unassigned',
        created_by: tc.created_by ? "#{tc.created_by.first_name} #{tc.created_by.last_name}" : nil,
        created_at: tc.created_at,
        updated_at: tc.updated_at
      }}
    }
  end

  def show
    test_case = TestCase.includes(:assigned_user, :created_by, :project).find(params[:id])

    # Check if user has access to this test case's project (skip if no current_user)
    if current_user && !current_user.admin? && !current_user.projects.include?(test_case.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    render json: test_case_json(test_case)
  end

  def create
    # Get project_id
    project_id = params.dig(:test_case, :project_id)
    project_id = project_id.present? ? project_id.to_i : nil
    
    # Validate project exists, fallback to first accessible project
    if project_id && !Project.exists?(project_id)
      project_id = nil
    end
    
    # If no project_id, assign to first accessible project
    if project_id.nil?
      if current_user&.admin?
        project_id = Project.first&.id
      else
        project_id = current_user&.projects&.first&.id
      end
    end
    
    # Check if user has access to create in the specified project (skip if no current_user or no project_id)
    if current_user && project_id && !current_user.admin? && !current_user.projects.pluck(:id).include?(project_id)
      render json: { error: 'Access denied to this project' }, status: :forbidden
      return
    end
    
    # Find assigned user by name
    assigned_user_name = params.dig(:test_case, :assigned_user)
    assigned_user_id = nil
    
    if assigned_user_name.present? && assigned_user_name != 'Unassigned' && assigned_user_name != 'Select assignee'
      # Find user by exact full name match
      assigned_user = User.all.find { |u| "#{u.first_name} #{u.last_name}" == assigned_user_name }
      
      # Fallback: search by email if it's not a full name
      if !assigned_user
        assigned_user = User.find_by(email: assigned_user_name)
      end
      
      assigned_user_id = assigned_user&.id
    end
    
    creator_id = current_user.id

    # If no users exist at all, return error
    if creator_id.nil?
      render json: { error: 'No users found in database. Please create at least one user first.' }, status: :unprocessable_entity
      return
    end

    test_case = TestCase.new(test_case_params.except(:assigned_user).merge(
      created_by_id: creator_id,
      assigned_user_id: assigned_user_id,
      steps: params.dig(:test_case, :test_steps) || params.dig(:test_case, :steps),
      expected_results: params.dig(:test_case, :expected_results),
      project_id: project_id
    ))
    
    if test_case.save
      test_case.reload
      render json: test_case_json(test_case), status: :created
    else
      render json: { errors: test_case.errors }, status: :unprocessable_entity
    end
  end

  def update
    test_case = TestCase.find(params[:id])

    # Check if user has access to this test case's project (skip if no current_user)
    if current_user && !current_user.admin? && !current_user.projects.include?(test_case.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    
    # Find assigned user by name if provided
    assigned_user_name = params.dig(:test_case, :assigned_user)
    assigned_user_id = test_case.assigned_user_id
    
    if assigned_user_name.present? && assigned_user_name != 'Unassigned'
      assigned_user = User.all.find { |u| "#{u.first_name} #{u.last_name}" == assigned_user_name }
      assigned_user_id = assigned_user&.id if assigned_user
    elsif assigned_user_name == 'Unassigned' || assigned_user_name.blank?
      assigned_user_id = nil
    end
    
    project_id = params.dig(:test_case, :project_id)
    project_id = project_id.present? ? project_id.to_i : nil
    
    update_params = test_case_params.except(:assigned_user).merge(
      assigned_user_id: assigned_user_id,
      project_id: project_id
    )
    # Map test_steps from frontend to steps column
    if params.dig(:test_case, :test_steps).present?
      update_params[:steps] = params.dig(:test_case, :test_steps)
    end
    
    old_status = test_case.status
    
    if test_case.update(update_params)
      # Send Slack notification if status changed to failed
      if old_status != test_case.status && test_case.status == 'failed'
        SlackService.notify_test_failure(test_case, "Test case status changed from #{old_status} to #{test_case.status}")
      elsif old_status != test_case.status && test_case.status == 'passed'
        SlackService.notify_test_success(test_case)
      end
      
      test_case.reload
      render json: test_case_json(test_case)
    else
      render json: { errors: test_case.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    test_case = TestCase.find(params[:id])

    # Check if user has access to this test case's project (skip if no current_user)
    if current_user && !current_user.admin? && !current_user.projects.include?(test_case.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    
    test_case.destroy
    render json: { message: 'Test case deleted successfully' }
  end

  private

  def test_case_params
    params.require(:test_case).permit(:title, :description, :status, :steps, :expected_results, :project_id, :assigned_user, :created_by_id, :priority, :test_type, :preconditions, :test_data, :post_conditions, :automation_status, :estimated_duration, :tags)
  end

  def test_case_json(test_case)
    {
      id: test_case.id,
      title: test_case.title,
      description: test_case.description,
      preconditions: test_case.preconditions,
      test_steps: test_case.steps,
      expected_results: test_case.expected_results,
      test_data: test_case.test_data,
      post_conditions: test_case.post_conditions,
      status: test_case.status,
      priority: test_case.priority,
      test_type: test_case.test_type,
      automation_status: test_case.automation_status,
      estimated_duration: test_case.estimated_duration,
      tags: test_case.tags,
      project_id: test_case.project_id,
      project_name: test_case.project&.name || 'No Project',
      assigned_user: test_case.assigned_user ? "#{test_case.assigned_user.first_name} #{test_case.assigned_user.last_name}" : 'Unassigned',
      assigned_user_id: test_case.assigned_user_id,
      created_by: test_case.created_by ? "#{test_case.created_by.first_name} #{test_case.created_by.last_name}" : nil,
      created_at: test_case.created_at,
      updated_at: test_case.updated_at
    }
  end


end
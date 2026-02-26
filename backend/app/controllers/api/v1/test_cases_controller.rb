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

    # Full-text search
    if params[:q].present?
      q = "%#{params[:q]}%"
      test_cases = test_cases.where('test_cases.title LIKE ? OR test_cases.description LIKE ?', q, q)
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

  def import
    require 'csv'
    file = params[:file]

    unless file.present?
      render json: { error: 'No file provided' }, status: :unprocessable_entity
      return
    end

    project_id = params[:project_id] ||
                 (current_user&.admin? ? Project.first&.id : current_user&.projects&.first&.id)
    imported = 0
    skipped  = 0
    errors   = []

    begin
      csv_text = file.read.force_encoding('UTF-8')
      CSV.parse(csv_text, headers: true, skip_blanks: true) do |row|
        title = row['title'] || row['Title'] || row[0]
        if title.blank?
          skipped += 1
          next
        end

        tc = TestCase.new(
          title:            title.to_s.strip,
          description:      row['description'] || row['Description'] || '',
          steps:            row['steps'] || row['test_steps'] || row['Steps'] || '',
          expected_results: row['expected_results'] || row['Expected Results'] || '',
          status:           (row['status']&.strip.presence || 'draft'),
          priority:         (row['priority']&.strip.presence || 'medium'),
          test_type:        (row['test_type']&.strip.presence || 'manual'),
          project_id:       project_id,
          created_by_id:    current_user&.id
        )

        if tc.save
          imported += 1
        else
          errors << { row: imported + skipped + 1, errors: tc.errors.full_messages }
          skipped += 1
        end
      end
    rescue CSV::MalformedCSVError => e
      render json: { error: "Invalid CSV format: #{e.message}" }, status: :unprocessable_entity
      return
    end

    render json: { imported: imported, skipped: skipped, errors: errors }, status: :created
  end

  def export
    test_cases = TestCase.all
    test_cases = test_cases.where(project_id: params[:project_id]) if params[:project_id].present?

    csv_data = "id,title,status,priority,test_type,project\n"
    test_cases.each do |tc|
      csv_data += "#{tc.id},\"#{tc.title}\",#{tc.status},#{tc.priority},#{tc.test_type},\"#{tc.project&.name}\"\n"
    end

    send_data csv_data, type: 'text/csv', disposition: 'attachment', filename: 'test_cases.csv'
  end

  def history
    test_case = TestCase.find(params[:id])
    runs = TestRun.where("notes LIKE ?", "%#{test_case.id}%").order(created_at: :desc).limit(20)
    render json: { history: runs }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Test case not found' }, status: :not_found
  end

  def attachments
    test_case = TestCase.find(params[:id])
    attachments = TestCaseAttachment.where(test_case_id: test_case.id) rescue []
    render json: { attachments: attachments }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Test case not found' }, status: :not_found
  end

  def upload_attachment
    test_case = TestCase.find(params[:id])
    file = params[:file]

    unless file.present?
      render json: { error: 'No file provided' }, status: :unprocessable_entity
      return
    end

    render json: { message: 'Attachment uploaded', filename: file.original_filename }, status: :created
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Test case not found' }, status: :not_found
  end

  def clone
    original = TestCase.find(params[:id])
    cloned = original.dup
    cloned.title = "Copy of #{original.title}"
    cloned.status = 'draft'
    cloned.created_by_id = current_user&.id || original.created_by_id

    if cloned.save
      render json: test_case_json(cloned), status: :created
    else
      render json: { errors: cloned.errors }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Test case not found' }, status: :not_found
  end

  def run
    test_case = TestCase.find(params[:id])
    test_run = TestRun.new(
      name: "Run: #{test_case.title}",
      status: 'running',
      project_id: test_case.project_id,
      created_by_id: current_user&.id,
      started_at: Time.current
    )

    if test_run.save
      render json: { message: 'Test run started', test_run_id: test_run.id, status: test_run.status }, status: :created
    else
      render json: { errors: test_run.errors }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Test case not found' }, status: :not_found
  end

  # POST /api/v1/test_cases/bulk_delete  { ids: [1,2,3] }
  def bulk_delete
    ids = Array(params[:ids]).map(&:to_i)
    scope = TestCase.where(id: ids)
    unless current_user&.admin?
      accessible = current_user&.projects&.pluck(:id) || []
      scope = scope.where(project_id: accessible)
    end
    deleted = scope.destroy_all.count
    render json: { message: "#{deleted} test case(s) deleted", deleted: deleted }
  end

  # POST /api/v1/test_cases/bulk_update_status  { ids: [1,2], status: 'active' }
  def bulk_update_status
    ids    = Array(params[:ids]).map(&:to_i)
    status = params[:status]
    allowed = %w[draft active in_progress passed failed skipped blocked]
    unless allowed.include?(status)
      render json: { error: "Invalid status. Allowed: #{allowed.join(', ')}" }, status: :unprocessable_entity
      return
    end
    scope = TestCase.where(id: ids)
    unless current_user&.admin?
      accessible = current_user&.projects&.pluck(:id) || []
      scope = scope.where(project_id: accessible)
    end
    updated = scope.update_all(status: status, updated_at: Time.current)
    render json: { message: "#{updated} test case(s) updated to '#{status}'", updated: updated }
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
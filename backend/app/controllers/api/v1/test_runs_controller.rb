class Api::V1::TestRunsController < ApplicationController
  def index
    begin
      test_runs = TestRun.includes(:project, :user).order(created_at: :desc).limit(50)
      render json: test_runs.map { |tr| {
        id: tr.id,
        name: "Test Run ##{tr.id}",
        project: tr.project&.name || 'BugZera',
        status: tr.status || 'pending',
        date: tr.created_at&.strftime('%Y-%m-%d %H:%M') || 'N/A',
        duration: tr.execution_time ? "#{tr.execution_time}s" : 'N/A',
        passRate: calculate_pass_rate(tr),
        current_step: tr.current_step,
        repository_url: tr.repository_url,
        branch: tr.branch,
        created_at: tr.created_at,
        execution_time: tr.execution_time
      }}
    rescue => e
      Rails.logger.error "Test runs index error: #{e.message}"
      render json: { error: 'Failed to fetch test runs', details: e.message }, status: :internal_server_error
    end
  end

  def create
    # Ensure we have valid foreign keys
    user_id = current_user.id
    project_id = params.dig(:test_run, :project_id) || Project.first&.id
    
    test_run = TestRun.new(
      status: 'pending',
      execution_time: 0,
      user_id: user_id,
      project_id: project_id,
      notes: params.dig(:test_run, :notes),
      settings: params.dig(:test_run, :settings)
    )
    
    if test_run.save
      # Send notification
      NotificationService.test_run_started(test_run, current_user) rescue nil

      # Start the test execution simulation in background thread
      Thread.new do
        TestExecutionSimulatorJob.new.perform(test_run.id)
      end
      render json: { id: test_run.id, status: 'pending' }, status: :created
    else
      render json: { errors: test_run.errors }, status: :unprocessable_entity
    end
  end
  
  def show
    test_run = TestRun.includes(:project).find(params[:id])

    if test_run.status.in?(['passed', 'failed'])
      expires_in 5.minutes, public: true
    else
      expires_now
    end

    render json: test_run_json(test_run)
  end

  def update
    test_run = TestRun.find(params[:id])
    if test_run.update(test_run_params)
      render json: test_run_json(test_run)
    else
      render json: { errors: test_run.errors }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Test run not found' }, status: :not_found
  end

  def destroy
    test_run = TestRun.find(params[:id])
    test_run.destroy
    head :no_content
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Test run not found' }, status: :not_found
  end

  def rerun
    original = TestRun.find(params[:id])
    new_run = TestRun.new(
      status: 'pending',
      execution_time: 0,
      user_id: current_user.id,
      project_id: original.project_id,
      notes: original.notes,
      settings: original.settings
    )

    if new_run.save
      Thread.new { TestExecutionSimulatorJob.new.perform(new_run.id) }
      render json: { id: new_run.id, status: 'pending', message: 'Test run re-queued' }, status: :created
    else
      render json: { errors: new_run.errors }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Test run not found' }, status: :not_found
  end

  def compare
    ids = Array(params[:ids]).map(&:to_i).first(4)
    test_runs = TestRun.includes(:project).where(id: ids)
    render json: {
      test_runs: test_runs.map { |tr| test_run_json(tr) }
    }
  end

  def artifacts
    test_run = TestRun.find(params[:id])
    render json: {
      test_run_id: test_run.id,
      screenshots_url: test_run.try(:screenshots_url),
      video_url: test_run.try(:video_url),
      execution_logs: test_run.try(:execution_logs),
      performance_metrics: test_run.try(:performance_metrics)
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Test run not found' }, status: :not_found
  end

  private

  def test_run_json(tr)
    {
      id: tr.id,
      name: "Test Run ##{tr.id}",
      project: tr.project&.name || 'BugZera',
      status: tr.status || 'pending',
      date: tr.created_at&.strftime('%Y-%m-%d %H:%M') || 'N/A',
      duration: tr.execution_time ? "#{tr.execution_time}s" : 'N/A',
      passRate: calculate_pass_rate(tr),
      current_step: tr.current_step,
      repository_url: tr.repository_url,
      branch: tr.branch,
      created_at: tr.created_at,
      execution_time: tr.execution_time,
      notes: tr.notes
    }
  end

  def test_run_params
    params.require(:test_run).permit(:project_id, :notes, :settings, :status, :branch, :repository_url)
  end

  def calculate_pass_rate(test_run)
    return '0%' if test_run.status == 'failed'
    return '100%' if test_run.status == 'passed'
    return '50%' if test_run.status == 'running'
    return '0%' # pending
  end
end
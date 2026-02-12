class Api::V1::TestRunsController < ActionController::Base
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
    user_id = User.first&.id
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
    
    # Set cache headers based on test run status
    if test_run.status.in?(['passed', 'failed'])
      # Completed test runs can be cached for longer
      expires_in 5.minutes, public: true
    else
      # Active test runs should not be cached
      expires_now
    end
    
    render json: {
      id: test_run.id,
      name: "Test Run ##{test_run.id}",
      project: test_run.project&.name || 'BugZera',
      status: test_run.status,
      date: test_run.created_at.strftime('%Y-%m-%d %H:%M'),
      duration: test_run.execution_time ? "#{test_run.execution_time}s" : 'N/A',
      passRate: calculate_pass_rate(test_run),
      current_step: test_run.current_step,
      repository_url: test_run.repository_url,
      branch: test_run.branch,
      created_at: test_run.created_at,
      execution_time: test_run.execution_time,
      notes: test_run.notes
    }
  end

  private

  def test_run_params
    params.require(:test_run).permit(:project_id, :notes, :settings)
  end

  def calculate_pass_rate(test_run)
    return '0%' if test_run.status == 'failed'
    return '100%' if test_run.status == 'passed'
    return '50%' if test_run.status == 'running'
    return '0%' # pending
  end
end
require 'csv'

class Api::V1::AnalyticsController < ApplicationController
  def overview
    pid = accessible_project_ids
    tr_scope = pid ? TestRun.where(project_id: pid) : TestRun.all
    tk_scope = pid ? Ticket.where(project_id: pid)  : Ticket.all
    tc_scope = pid ? TestCase.where(project_id: pid): TestCase.all

    # Test execution stats (last 30 days)
    recent_runs = tr_scope.where('created_at >= ?', 30.days.ago)
    total_runs  = recent_runs.count
    pass_rate   = total_runs > 0 ? (recent_runs.where(status: 'passed').count.to_f / total_runs * 100).round(1) : 0
    fail_rate   = total_runs > 0 ? (recent_runs.where(status: 'failed').count.to_f / total_runs * 100).round(1) : 0

    # Ticket resolution
    closed_tickets = tk_scope.where(status: 'done').where('updated_at >= ?', 30.days.ago).count
    open_tickets   = tk_scope.where(status: %w[open in_progress in_review qa_ready]).count
    total_tickets  = tk_scope.count
    resolution_rate = total_tickets > 0 ? ((total_tickets - open_tickets).to_f / total_tickets * 100).round(1) : 0

    # Avg execution time
    avg_exec_time = tr_scope.where.not(execution_time: nil).average(:execution_time)&.round(0) || 0

    # Automation coverage
    total_cases   = tc_scope.count
    automated     = tc_scope.joins(:automation_scripts).where(automation_scripts: { status: 'active' }).distinct.count
    auto_coverage = total_cases > 0 ? (automated.to_f / total_cases * 100).round(1) : 0

    render json: {
      test_execution: {
        total_runs: total_runs,
        pass_rate: pass_rate,
        fail_rate: fail_rate,
        avg_execution_time_seconds: avg_exec_time
      },
      ticket_summary: {
        total_tickets: total_tickets,
        open_tickets: open_tickets,
        closed_this_month: closed_tickets,
        resolution_rate: resolution_rate
      },
      automation_coverage: auto_coverage,
      test_cases_total: total_cases
    }
  end

  def trends
    pid = accessible_project_ids
    tr_scope = pid ? TestRun.where(project_id: pid) : TestRun.all
    tk_scope = pid ? Ticket.where(project_id: pid)  : Ticket.all
    tc_scope = pid ? TestCase.where(project_id: pid): TestCase.all

    days = (params[:days] || 30).to_i.clamp(7, 90)
    data = []
    days.times do |i|
      date = (days - 1 - i).days.ago.beginning_of_day
      next_date = date + 1.day
      data << {
        date:       date.strftime('%b %d'),
        passed:     tr_scope.where(status: 'passed', created_at: date..next_date).count,
        failed:     tr_scope.where(status: 'failed', created_at: date..next_date).count,
        tickets:    tk_scope.where(created_at: date..next_date).count,
        test_cases: tc_scope.where(created_at: date..next_date).count
      }
    end
    render json: { trends: data }
  end

  def by_project
    pid      = accessible_project_ids
    projects = pid ? Project.where(id: pid) : Project.all
    data = projects.map do |p|
      runs   = TestRun.where(project_id: p.id)
      total  = runs.count
      passed = runs.where(status: 'passed').count
      {
        project_id: p.id,
        project_name: p.name,
        total_test_runs: total,
        pass_rate: total > 0 ? (passed.to_f / total * 100).round(1) : 0,
        open_tickets: Ticket.where(project_id: p.id, status: %w[open in_progress]).count,
        test_cases: TestCase.where(project_id: p.id).count
      }
    end
    render json: { projects: data }
  end

  def ticket_breakdown
    pid      = accessible_project_ids
    tk_scope = pid ? Ticket.where(project_id: pid) : Ticket.all

    by_status   = tk_scope.group(:status).count
    by_severity = tk_scope.group(:severity).count
    monthly = (0..5).map do |i|
      month = i.months.ago.beginning_of_month
      next_month = month + 1.month
      {
        month:    month.strftime('%b %Y'),
        created:  tk_scope.where(created_at: month..next_month).count,
        resolved: tk_scope.where(status: 'done', updated_at: month..next_month).count
      }
    end.reverse
    render json: { by_status: by_status, by_severity: by_severity, monthly: monthly }
  end

  def sprint_velocity
    sprints = Sprint.order(:end_date).last(10)
    data = sprints.map do |s|
      {
        sprint_name: s.name,
        capacity: s.capacity || 0,
        target_velocity: s.target_velocity || 0,
        completion_percentage: s.completion_percentage || 0,
        test_cases_added: TestCase.where('created_at >= ? AND created_at <= ?', s.start_date, s.end_date).count,
        tickets_resolved: Ticket.where(sprint_id: s.id, status: 'done').count
      }
    end
    render json: { velocity: data }
  end

  def dashboard
    widgets = DashboardWidget.where(user_id: @current_user.id).order(:id)
    render json: widgets
  end

  def update_dashboard
    widgets_data = params[:widgets] || []
    DashboardWidget.where(user_id: @current_user.id).destroy_all
    widgets = widgets_data.map do |w|
      DashboardWidget.create!(
        user_id: @current_user.id,
        widget_type: w[:widget_type],
        configuration: w[:configuration].to_json,
        position: w[:position].to_json,
        is_visible: w.fetch(:is_visible, true)
      )
    end
    render json: widgets
  end

  def report
    type = params[:type]
    case type
    when 'test_execution'
      render json: build_test_execution_report
    when 'tickets'
      render json: build_ticket_report
    when 'sprints'
      render json: build_sprint_report
    else
      render json: { error: "Unknown report type: #{type}" }, status: :unprocessable_entity
    end
  end

  def export
    type = params[:type]   || 'test_runs'
    fmt  = params[:format] || 'csv'
    pid  = accessible_project_ids

    case type
    when 'tickets'
      scope = (pid ? Ticket.where(project_id: pid) : Ticket.all)
              .includes(:project, :assigned_user).order(created_at: :desc).limit(5000)
      csv_str = CSV.generate(headers: true) do |csv|
        csv << ['ID', 'Title', 'Status', 'Severity', 'Priority', 'Project', 'Assigned To', 'Created At']
        scope.each do |t|
          csv << [t.id, t.title, t.status, t.severity, t.priority,
                  t.project&.name, t.assigned_user&.full_name,
                  t.created_at&.strftime('%Y-%m-%d %H:%M')]
        end
      end
      filename = 'tickets_export'

    when 'test_cases'
      scope = (pid ? TestCase.where(project_id: pid) : TestCase.all)
              .includes(:project, :assigned_user).order(created_at: :desc).limit(5000)
      csv_str = CSV.generate(headers: true) do |csv|
        csv << ['ID', 'Title', 'Status', 'Priority', 'Test Type', 'Project', 'Assigned To', 'Created At']
        scope.each do |tc|
          csv << [tc.id, tc.title, tc.status, tc.priority, tc.test_type,
                  tc.project&.name, tc.assigned_user&.full_name,
                  tc.created_at&.strftime('%Y-%m-%d %H:%M')]
        end
      end
      filename = 'test_cases_export'

    else # test_runs (default)
      scope = (pid ? TestRun.where(project_id: pid) : TestRun.all)
              .includes(:project, :user).order(created_at: :desc).limit(5000)
      csv_str = CSV.generate(headers: true) do |csv|
        csv << ['ID', 'Status', 'Project', 'Execution Time (s)', 'Branch', 'Triggered By', 'Created At']
        scope.each do |r|
          csv << [r.id, r.status, r.project&.name, r.execution_time,
                  r.branch, r.user&.full_name,
                  r.created_at&.strftime('%Y-%m-%d %H:%M')]
        end
      end
      filename = 'test_runs_export'
    end

    if fmt == 'excel'
      send_data csv_str, type: 'application/vnd.ms-excel',
                         disposition: 'attachment',
                         filename: "#{filename}.xls"
    else
      send_data csv_str, type: 'text/csv',
                         disposition: 'attachment',
                         filename: "#{filename}.csv"
    end
  end

  def schedule
    sr = ScheduledReport.new(
      report_id: params[:report_id],
      schedule: params[:schedule],
      recipients: params[:recipients].to_json,
      format: params[:format] || 'pdf',
      is_active: true
    )
    if sr.save
      render json: sr, status: :created
    else
      render json: { errors: sr.errors }, status: :unprocessable_entity
    end
  end

  private

  # Returns nil for admins (no filter) or array of project IDs for scoped users
  def accessible_project_ids
    return nil if current_user&.admin?
    current_user&.projects&.pluck(:id) || []
  end

  def build_test_execution_report
    runs = TestRun.order(created_at: :desc).limit(100)
    {
      total:   runs.count,
      passed:  runs.where(status: 'passed').count,
      failed:  runs.where(status: 'failed').count,
      pending: runs.where(status: 'pending').count,
      runs: runs.map { |r| { id: r.id, status: r.status, created_at: r.created_at } }
    }
  end

  def build_ticket_report
    {
      total:       Ticket.count,
      by_status:   Ticket.group(:status).count,
      by_severity: Ticket.group(:severity).count,
      by_priority: Ticket.group(:priority).count
    }
  end

  def build_sprint_report
    sprints = Sprint.order(created_at: :desc).limit(20)
    {
      total:   sprints.count,
      sprints: sprints.map { |s| { id: s.id, name: s.name, status: s.status, completion_percentage: s.completion_percentage } }
    }
  end
end

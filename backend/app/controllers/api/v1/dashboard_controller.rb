class Api::V1::DashboardController < ApplicationController
  def metrics
    pid = accessible_project_ids
    tc_scope = pid ? TestCase.where(project_id: pid) : TestCase.all
    tk_scope = pid ? Ticket.where(project_id: pid)   : Ticket.all
    tr_scope = pid ? TestRun.where(project_id: pid)  : TestRun.all

    total_test_cases  = tc_scope.count
    active_test_cases = tc_scope.where(status: %w[active in_progress]).count
    open_tickets      = tk_scope.where(status: %w[open in_progress in_review qa_ready]).count
    total_tickets     = tk_scope.count
    closed_tickets    = total_tickets - open_tickets

    # Pass rate (last 30 days)
    recent_runs = tr_scope.where('created_at >= ?', 30.days.ago)
    pass_rate   = recent_runs.any? ? (recent_runs.where(status: 'passed').count.to_f / recent_runs.count * 100).round(1) : 0
    fail_rate   = recent_runs.any? ? (recent_runs.where(status: 'failed').count.to_f / recent_runs.count * 100).round(1) : 0

    # Bug resolution rate
    resolution_rate = total_tickets > 0 ? (closed_tickets.to_f / total_tickets * 100).round(1) : 0

    # Average execution time
    avg_exec = tr_scope.where.not(execution_time: nil).average(:execution_time)&.round(0) || 0

    # Active sprint
    active_sprint = Sprint.find_by(status: 'active')
    sprint_data = nil
    if active_sprint
      total_sprint_tickets = active_sprint.tickets.count
      done_sprint_tickets  = active_sprint.tickets.where(status: 'done').count
      completion = total_sprint_tickets > 0 ? (done_sprint_tickets.to_f / total_sprint_tickets * 100).round(0) : 0
      sprint_data = {
        id:   active_sprint.id,
        name: active_sprint.name,
        end_date: active_sprint.end_date,
        total_tickets: total_sprint_tickets,
        done_tickets: done_sprint_tickets,
        completion_percentage: completion
      }
    end

    # Upcoming calendar events (next 7 days)
    upcoming_events = CalendarEvent.where('start_time >= ? AND start_time <= ?', Time.current, 7.days.from_now)
                                   .order(:start_time)
                                   .limit(5)
                                   .as_json(only: [:id, :title, :start_time, :event_type, :location])

    # Recent test runs
    recent_test_runs = tr_scope.includes(:test_case, :user)
                               .order(created_at: :desc)
                               .limit(5)
                               .map do |r|
      {
        id: r.id,
        test_case_title: r.test_case&.title || 'Unknown',
        status: r.status,
        user: r.user&.full_name,
        created_at: r.created_at
      }
    end

    render json: {
      test_metrics: {
        total_test_cases: total_test_cases,
        active_test_cases: active_test_cases,
        pass_rate: pass_rate,
        fail_rate: fail_rate,
        avg_execution_time: avg_exec,
        total_runs_this_month: recent_runs.count
      },
      ticket_metrics: {
        open_tickets: open_tickets,
        closed_tickets: closed_tickets,
        total_tickets: total_tickets,
        resolution_rate: resolution_rate
      },
      automation_metrics: {
        automation_coverage: calculate_automation_coverage
      },
      active_sprint: sprint_data,
      upcoming_events: upcoming_events,
      recent_test_runs: recent_test_runs,
      projects_count: Project.count,
      users_count: User.count
    }
  end

  def user_activity
    online_threshold = 5.minutes.ago
    today_threshold = 1.day.ago
    week_threshold = 1.week.ago
    
    # Get total users count
    total_users = User.count
    online_users = User.where('updated_at >= ?', online_threshold).count
    today_active = User.where('updated_at >= ?', today_threshold).count
    week_active = User.where('updated_at >= ?', week_threshold).count
    
    # Get all users for activity display
    all_users = User.includes(:created_test_cases, :assigned_test_cases, :created_tickets)
                   .order(updated_at: :desc)
                   .limit(10)
    
    users_data = all_users.map do |user|
      last_activity = get_user_last_activity(user)
      {
        id: user.id,
        name: user.full_name,
        initials: "#{user.first_name[0]}#{user.last_name[0]}".upcase,
        status: user.updated_at && user.updated_at >= online_threshold ? 'online' : 
                user.updated_at && user.updated_at >= today_threshold ? 'away' : 'offline',
        activity: last_activity[:action],
        active_time: user.updated_at ? time_ago_in_words(user.updated_at) : 'Never',
        last_seen: user.updated_at ? user.updated_at.strftime('%H:%M') : '--:--',
        progress: calculate_user_progress(user)
      }
    end
    
    render json: {
      onlineUsers: total_users,
      todayActive: [today_active, total_users].max,
      weekActive: [week_active, total_users].max,
      users: users_data
    }
  end

  def trends
    pid = accessible_project_ids
    tc_scope = pid ? TestCase.where(project_id: pid) : TestCase.all
    tk_scope = pid ? Ticket.where(project_id: pid)   : Ticket.all
    tr_scope = pid ? TestRun.where(project_id: pid)  : TestRun.all

    # Get activity data for last 7 days
    trends_data = []
    7.times do |i|
      date = i.days.ago.beginning_of_day
      next_date = date + 1.day

      test_cases_count = tc_scope.where(created_at: date..next_date).count
      tickets_count    = tk_scope.where(created_at: date..next_date).count
      test_runs_count  = tr_scope.where(created_at: date..next_date).count
      
      trends_data.unshift({
        date: date.strftime('%a'),
        testCases: test_cases_count,
        tickets: tickets_count,
        testRuns: test_runs_count,
        total: test_cases_count + tickets_count + test_runs_count
      })
    end
    
    render json: {
      activity_timeline: trends_data
    }
  end

  private

  # Returns nil for admins (no filter) or array of project IDs for scoped users
  def accessible_project_ids
    return nil if current_user&.admin?
    current_user&.projects&.pluck(:id) || []
  end

  def calculate_automation_coverage
    total_test_cases = TestCase.count
    return 0 if total_test_cases.zero?
    
    automated_cases = TestCase.joins(:automation_scripts)
                             .where(automation_scripts: { status: 'active' })
                             .distinct
                             .count
    
    (automated_cases.to_f / total_test_cases * 100).round(1)
  end

  def get_user_last_activity(user)
    # Check recent activities
    recent_test_case = user.created_test_cases.order(created_at: :desc).first
    recent_ticket = user.created_tickets.order(created_at: :desc).first
    recent_run = user.test_runs.order(created_at: :desc).first
    
    activities = [
      recent_test_case ? { time: recent_test_case.created_at, action: 'Created test case' } : nil,
      recent_ticket ? { time: recent_ticket.created_at, action: 'Created ticket' } : nil,
      recent_run ? { time: recent_run.created_at, action: 'Executed test' } : nil
    ].compact.sort_by { |a| a[:time] }.last
    
    activities || { action: 'No recent activity', time: user.updated_at }
  end

  def calculate_user_progress(user)
    # Simple progress based on recent activity
    activities_count = user.created_test_cases.where('created_at >= ?', 1.week.ago).count +
                      user.created_tickets.where('created_at >= ?', 1.week.ago).count +
                      user.test_runs.where('created_at >= ?', 1.week.ago).count
    
    [activities_count * 20, 100].min
  end

  def time_ago_in_words(time)
    seconds = Time.current - time
    case seconds
    when 0..59
      'Just now'
    when 60..3599
      "#{(seconds / 60).to_i}m ago"
    when 3600..86399
      "#{(seconds / 3600).to_i}h ago"
    else
      "#{(seconds / 86400).to_i}d ago"
    end
  end
end
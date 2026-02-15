class Api::V1::DashboardController < ApplicationController
  def metrics
    total_test_cases = TestCase.count
    active_test_cases = TestCase.where(status: ['active', 'in_progress']).count
    open_tickets = Ticket.where(status: ['open', 'in_progress']).count
    
    # Calculate pass rate from recent test runs
    recent_runs = TestRun.where('created_at >= ?', 30.days.ago)
    pass_rate = recent_runs.any? ? (recent_runs.where(status: 'passed').count.to_f / recent_runs.count * 100).round(1) : 0
    
    render json: {
      test_metrics: {
        total_test_cases: total_test_cases,
        active_test_cases: active_test_cases,
        pass_rate: pass_rate
      },
      ticket_metrics: {
        open_tickets: open_tickets,
        total_tickets: Ticket.count
      },
      automation_metrics: {
        automation_coverage: calculate_automation_coverage
      }
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
    # Get activity data for last 7 days
    trends_data = []
    7.times do |i|
      date = i.days.ago.beginning_of_day
      next_date = date + 1.day
      
      test_cases_count = TestCase.where(created_at: date..next_date).count
      tickets_count = Ticket.where(created_at: date..next_date).count
      test_runs_count = TestRun.where(created_at: date..next_date).count
      
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
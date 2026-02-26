namespace :scheduled_reports do
  desc 'Process and email all active scheduled reports (run daily via cron)'
  task run: :environment do
    require 'csv'

    today      = Date.current
    day_of_week = today.strftime('%A').downcase  # "monday", "tuesday", etc.
    day_of_month = today.day

    active_reports = ScheduledReport.where(is_active: true)
    Rails.logger.info "ScheduledReports: Processing #{active_reports.count} active scheduled report(s)"

    active_reports.each do |sr|
      schedule = sr.schedule.to_s.downcase  # 'daily', 'weekly', 'monthly'

      # Check if today matches the schedule
      should_run = case schedule
                   when 'daily'   then true
                   when 'weekly'  then day_of_week == 'monday'
                   when 'monthly' then day_of_month == 1
                   else false
                   end

      next unless should_run

      recipients = begin
        JSON.parse(sr.recipients || '[]')
      rescue
        []
      end

      next if recipients.empty?

      # Build report data
      report_data = build_report_data(sr)
      next unless report_data

      csv_str = generate_csv(report_data)
      subject = "BugZera Scheduled Report — #{sr.format&.upcase || 'CSV'} — #{today}"
      body    = "Please find your scheduled #{schedule} report attached.\n\nGenerated: #{Time.current.strftime('%d %b %Y %H:%M')}"

      recipients.each do |email|
        next unless email.include?('@')
        begin
          UserMailer.notification_email(email, subject, body).deliver_now
          Rails.logger.info "ScheduledReports: Sent report to #{email}"
        rescue => e
          Rails.logger.error "ScheduledReports: Failed to email #{email}: #{e.message}"
        end
      end

      sr.update_columns(last_run_at: Time.current) rescue nil
    end

    Rails.logger.info 'ScheduledReports: Done'
  end

  def build_report_data(sr)
    report = sr.report_id ? Report.find_by(id: sr.report_id) : nil
    report_type = report&.report_type || 'test_runs'

    case report_type
    when 'tickets'
      rows = Ticket.includes(:project, :assigned_user).order(created_at: :desc).limit(1000)
      { headers: ['ID', 'Title', 'Status', 'Severity', 'Priority', 'Project', 'Assigned To', 'Created At'],
        rows: rows.map { |t| [t.id, t.title, t.status, t.severity, t.priority, t.project&.name, t.assigned_user&.full_name, t.created_at&.strftime('%Y-%m-%d')] } }
    else # test_runs
      rows = TestRun.includes(:project, :user).order(created_at: :desc).limit(1000)
      { headers: ['ID', 'Status', 'Project', 'Execution Time (s)', 'Branch', 'Triggered By', 'Created At'],
        rows: rows.map { |r| [r.id, r.status, r.project&.name, r.execution_time, r.branch, r.user&.full_name, r.created_at&.strftime('%Y-%m-%d')] } }
    end
  end

  def generate_csv(data)
    require 'csv'
    CSV.generate(headers: true) do |csv|
      csv << data[:headers]
      data[:rows].each { |row| csv << row }
    end
  end
end

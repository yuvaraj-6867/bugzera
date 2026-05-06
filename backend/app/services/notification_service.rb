class NotificationService
  # ── Ticket events ──────────────────────────────────────────────────────────
  def self.ticket_created(ticket, creator)
    title   = "New Ticket: #{ticket.title}"
    message = "#{creator.full_name} created ticket '#{ticket.title}' in project #{ticket.project&.name}."
    notify_all_with_pref(:inapp_tickets, title, message, ticket)
  end

  def self.ticket_updated(ticket, updater)
    title   = "Ticket Updated: #{ticket.title}"
    message = "#{updater.full_name} updated ticket '#{ticket.title}' — status: #{ticket.status}."
    notify_all_with_pref(:inapp_tickets, title, message, ticket)
  end

  # ── Test run events ────────────────────────────────────────────────────────
  def self.test_run_started(test_run, user)
    title   = "Test Run ##{test_run.id} Started"
    message = "#{user.full_name} started a test run for project #{test_run.project&.name}."
    notify_all_with_pref(:inapp_test_runs, title, message, test_run)
  end

  def self.test_run_completed(test_run)
    label   = test_run.status == 'passed' ? 'Passed ✓' : 'Failed ✗'
    title   = "Test Run ##{test_run.id} #{label}"
    message = "Test Run ##{test_run.id} for project #{test_run.project&.name} has #{test_run.status}."
    notify_all_with_pref(:inapp_test_runs, title, message, test_run)
  end

  # ── Helpers ────────────────────────────────────────────────────────────────
  def self.notify_all_with_pref(pref_key, title, message, notifiable = nil)
    email_pref_key = pref_key.to_s.sub('inapp_', 'email_').to_sym

    User.active.each do |user|
      prefs = NotificationPreference.for_user(user)

      # In-app notification
      if prefs.inapp_enabled && prefs.public_send(pref_key)
        create_notification(user: user, title: title, message: message, notifiable: notifiable)
      end

      # Email notification — all users with email preference enabled
      if prefs.email_enabled && prefs.public_send(email_pref_key)
        UserMailer.notification_email(user.email, title, message).deliver_now
      end
    rescue => e
      Rails.logger.error "NotificationService error for user #{user.id}: #{e.message}"
    end
  end

  def self.create_notification(user:, title:, message:, type: 'info', notifiable: nil)
    notification = Notification.create!(
      user: user,
      title: title,
      message: message,
      notification_type: type,
      notifiable: notifiable
    )
    
    # Broadcast live update
    ActionCable.server.broadcast("notifications_#{user.id}", {
      type: 'new_notification',
      notification: notification.as_json(only: [:id, :title, :message, :notification_type, :read, :created_at]),
      count: user.notifications.unread.count
    })
    
    notification
  end

  def self.notify_ticket_assigned(ticket)
    return unless ticket.assigned_user

    create_notification(
      user: ticket.assigned_user,
      title: "Ticket Assigned",
      message: "Ticket '#{ticket.title}' has been assigned to you",
      type: 'info',
      notifiable: ticket
    )

    # Email notification to assignee
    prefs = NotificationPreference.for_user(ticket.assigned_user)
    if prefs.email_enabled && prefs.email_ticket_updates
      UserMailer.notification_email(
        ticket.assigned_user.email,
        "Ticket Assigned: #{ticket.title}",
        "Ticket '#{ticket.title}' in project #{ticket.project&.name} has been assigned to you.\n\n#{ticket.description}"
      ).deliver_now
    end
  rescue => e
    Rails.logger.error "notify_ticket_assigned error: #{e.message}"
  end

  def self.notify_comment_added(comment)
    case comment.commentable_type
    when 'Ticket'
      ticket = comment.commentable
      if ticket.assigned_user && ticket.assigned_user != comment.user
        create_notification(
          user: ticket.assigned_user,
          title: "New Comment",
          message: "#{comment.user.full_name} commented on ticket '#{ticket.title}'",
          type: 'info',
          notifiable: comment
        )
      end
    when 'TestCase'
      test_case = comment.commentable
      if test_case.assigned_user && test_case.assigned_user != comment.user
        create_notification(
          user: test_case.assigned_user,
          title: "New Comment",
          message: "#{comment.user.full_name} commented on test case '#{test_case.title}'",
          type: 'info',
          notifiable: comment
        )
      end
    end
  end
end
class NotificationService
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
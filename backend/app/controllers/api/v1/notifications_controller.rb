class Api::V1::NotificationsController < ApplicationController
  def index
    notifications = current_user.notifications.recent.limit(20)
    render json: notifications.as_json(only: [:id, :title, :message, :notification_type, :read, :created_at])
  end

  def count
    unread_count = current_user.notifications.unread.count
    render json: { count: unread_count }
  end

  def read
    notification = current_user.notifications.find(params[:id])
    notification.mark_as_read!
    render json: { status: 'success' }
  end
end
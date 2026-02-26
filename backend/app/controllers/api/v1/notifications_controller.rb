class Api::V1::NotificationsController < ApplicationController
  def index
    notifications = @current_user.notifications.order(created_at: :desc).limit(20)
    render json: notifications.as_json(only: [:id, :title, :message, :notification_type, :read, :created_at])
  end

  def unread_count
    render json: { count: @current_user.notifications.where(read: false).count }
  end

  def read
    notification = @current_user.notifications.find(params[:id])
    notification.update(read: true, read_at: Time.current)
    render json: { status: 'success' }
  end

  def mark_all_read
    @current_user.notifications.where(read: false).update_all(read: true, read_at: Time.current)
    render json: { status: 'success' }
  end

  def destroy
    notification = @current_user.notifications.find(params[:id])
    notification.destroy
    render json: { status: 'deleted' }
  end

  def preferences
    prefs = NotificationPreference.for_user(@current_user)
    render json: prefs_json(prefs)
  end

  def update_preferences
    prefs = NotificationPreference.for_user(@current_user)
    if prefs.update(preference_params)
      render json: prefs_json(prefs)
    else
      render json: { error: prefs.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  private

  def preference_params
    params.permit(
      :inapp_enabled, :inapp_test_runs, :inapp_tickets, :inapp_mentions, :inapp_assignments,
      :email_enabled, :email_digest_mode, :email_test_runs, :email_tickets, :email_mentions, :email_assignments,
      :do_not_disturb_start, :do_not_disturb_end
    )
  end

  def prefs_json(prefs)
    prefs.as_json(except: [:created_at, :updated_at])
  end
end

class Api::V1::SettingsController < ApplicationController
  def show
    settings = UserSetting.find_or_create_by(user: @current_user) do |s|
      s.theme = 'system'
      s.language = 'en'
      s.timezone = 'UTC'
    end
    render json: { settings: settings.as_json(except: [:created_at, :updated_at]) }
  end

  def update
    settings = UserSetting.find_or_create_by(user: @current_user)
    if settings.update(settings_params)
      render json: { settings: settings.as_json(except: [:created_at, :updated_at]) }
    else
      render json: { error: settings.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  private

  def settings_params
    params.permit(:theme, :language, :timezone, :notifications_enabled, :email_notifications, :compact_view)
  end
end

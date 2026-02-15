class Api::SettingsController < ApplicationController
  def show
    render json: {
      appearance: {
        theme: current_user.setting.theme,
        language: current_user.setting.language,
        timezone: current_user.setting.timezone,
        compact_view: current_user.setting.compact_view
      },
      notifications: {
        notifications_enabled: current_user.setting.notifications_enabled,
        email_notifications: current_user.setting.email_notifications
      },
      available_options: {
        themes: %w[light dark system],
        languages: [
          { code: 'en', name: 'English' },
          { code: 'es', name: 'Español' },
          { code: 'fr', name: 'Français' },
          { code: 'de', name: 'Deutsch' },
          { code: 'ja', name: '日本語' }
        ],
        timezones: ActiveSupport::TimeZone.all.map { |tz| { name: tz.name, offset: tz.formatted_offset } }
      }
    }
  end

  def update
    setting = current_user.setting
    
    if setting.persisted?
      setting.update!(setting_params)
    else
      setting.assign_attributes(setting_params)
      setting.save!
    end

    render json: { message: 'Settings updated successfully' }
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors }, status: :unprocessable_entity
  end

  private

  def setting_params
    params.require(:settings).permit(:theme, :language, :timezone, :notifications_enabled, 
                                     :email_notifications, :compact_view)
  end

end
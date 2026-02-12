class UserSetting < ApplicationRecord
  belongs_to :user

  def self.default_settings
    {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notifications_enabled: true,
      email_notifications: true,
      compact_view: false
    }
  end
end
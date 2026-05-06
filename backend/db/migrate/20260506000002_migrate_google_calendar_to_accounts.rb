class MigrateGoogleCalendarToAccounts < ActiveRecord::Migration[7.1]
  def up
    User.where.not(google_calendar_access_token: nil).find_each do |user|
      user.google_calendar_accounts.find_or_create_by(email: user.google_calendar_email) do |a|
        a.access_token  = user.google_calendar_access_token
        a.refresh_token = user.google_calendar_refresh_token
        a.token_expiry  = user.google_calendar_token_expiry
        a.connected_at  = user.google_calendar_connected_at
      end
    end
  end

  def down
    # no-op: old columns still exist
  end
end

class AddGoogleCalendarToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :google_calendar_access_token,  :text    unless column_exists?(:users, :google_calendar_access_token)
    add_column :users, :google_calendar_refresh_token, :text    unless column_exists?(:users, :google_calendar_refresh_token)
    add_column :users, :google_calendar_token_expiry,  :datetime unless column_exists?(:users, :google_calendar_token_expiry)
    add_column :users, :google_calendar_connected_at,  :datetime unless column_exists?(:users, :google_calendar_connected_at)
    add_column :users, :google_calendar_email,         :string   unless column_exists?(:users, :google_calendar_email)
  end
end

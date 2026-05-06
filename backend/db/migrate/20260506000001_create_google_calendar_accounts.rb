class CreateGoogleCalendarAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :google_calendar_accounts do |t|
      t.references :user, null: false, foreign_key: true
      t.text :access_token
      t.text :refresh_token
      t.datetime :token_expiry
      t.string :email
      t.datetime :connected_at
      t.timestamps
    end
    add_index :google_calendar_accounts, [:user_id, :email], unique: true
  end
end

class AddTotpToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :totp_secret,  :string
    add_column :users, :totp_enabled, :boolean, default: false, null: false
    add_column :users, :totp_backup_codes, :text  # JSON array of one-time backup codes
  end
end

class CreateUserSettings < ActiveRecord::Migration[7.1]
  def change
    create_table :user_settings do |t|
      t.references :user, null: false, foreign_key: true
      t.string :theme, default: 'system'
      t.string :language, default: 'en'
      t.string :timezone, default: 'UTC'
      t.boolean :notifications_enabled, default: true
      t.boolean :email_notifications, default: true
      t.boolean :compact_view, default: false

      t.timestamps
    end
  end
end
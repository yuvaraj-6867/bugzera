class CreateNotificationPreferences < ActiveRecord::Migration[7.1]
  def change
    create_table :notification_preferences do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }

      # In-App
      t.boolean :inapp_enabled,     default: true
      t.boolean :inapp_test_runs,   default: true
      t.boolean :inapp_tickets,     default: true
      t.boolean :inapp_mentions,    default: true
      t.boolean :inapp_assignments, default: true

      # Email
      t.boolean :email_enabled,     default: true
      t.string  :email_digest_mode, default: 'immediate'
      t.boolean :email_test_runs,   default: true
      t.boolean :email_tickets,     default: true
      t.boolean :email_mentions,    default: true
      t.boolean :email_assignments, default: true

      # Do Not Disturb
      t.time    :do_not_disturb_start
      t.time    :do_not_disturb_end

      t.timestamps
    end
  end
end

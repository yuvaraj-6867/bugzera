class CreateNotifications < ActiveRecord::Migration[7.1]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title
      t.text :message
      t.string :notification_type
      t.boolean :read, default: false
      t.references :notifiable, polymorphic: true, null: true

      t.timestamps
    end
  end
end

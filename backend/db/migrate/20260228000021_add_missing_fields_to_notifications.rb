class AddMissingFieldsToNotifications < ActiveRecord::Migration[7.1]
  def change
    add_column :notifications, :category,                :string
                                                          # test_run, ticket, comment, mention, assignment, system
    add_column :notifications, :priority,                :string, default: 'medium'
    add_column :notifications, :action_url,              :string
    add_column :notifications, :action_text,             :string
    add_column :notifications, :read_at,                 :datetime
    add_column :notifications, :dismissed,               :boolean, default: false
    add_column :notifications, :aggregation_key,         :string
    add_column :notifications, :parent_notification_id,  :integer
    add_column :notifications, :sent_via_email,          :boolean, default: false
    add_column :notifications, :sent_via_push,           :boolean, default: false
    add_column :notifications, :data,                    :text    # JSON additional payload

    add_index :notifications, :category
    add_index :notifications, :dismissed
    add_index :notifications, :aggregation_key
  end
end

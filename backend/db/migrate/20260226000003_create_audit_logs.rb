class CreateAuditLogs < ActiveRecord::Migration[7.1]
  def change
    create_table :audit_logs do |t|
      t.integer :user_id
      t.string  :action, null: false
      t.string  :resource_type
      t.integer :resource_id
      t.text    :changes_made
      t.string  :ip_address
      t.string  :user_agent
      t.string  :status, default: 'success'
      t.text    :details
      t.timestamps
    end
    add_index :audit_logs, :user_id
    add_index :audit_logs, :action
    add_index :audit_logs, [:resource_type, :resource_id]
    add_index :audit_logs, :created_at
  end
end

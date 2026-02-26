class CreateIntegrationLogs < ActiveRecord::Migration[7.1]
  def change
    create_table :integration_logs do |t|
      t.integer :integration_id, null: false
      t.string  :action,         null: false   # sync, push, pull, webhook, etc.
      t.string  :status,         null: false, default: 'success'  # success, failed
      t.text    :request_data                  # JSON
      t.text    :response_data                 # JSON
      t.text    :error_message
      t.integer :duration_ms

      t.timestamps
    end
    add_index :integration_logs, :integration_id
    add_index :integration_logs, :status
    add_index :integration_logs, :created_at
  end
end

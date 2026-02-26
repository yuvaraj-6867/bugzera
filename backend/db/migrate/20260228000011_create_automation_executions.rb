class CreateAutomationExecutions < ActiveRecord::Migration[7.1]
  def change
    create_table :automation_executions do |t|
      t.integer :automation_script_id, null: false
      t.integer :triggered_by_id                    # user who triggered
      t.string  :status,               null: false, default: 'pending'
                                                     # pending, running, passed, failed, cancelled
      t.datetime :started_at
      t.datetime :completed_at
      t.integer  :duration_ms
      t.text    :execution_logs
      t.text    :error_message
      t.string  :trigger_type,         default: 'manual'  # manual, scheduled, webhook
      t.integer :environment_id
      t.text    :results                             # JSON test results

      t.timestamps
    end
    add_index :automation_executions, :automation_script_id
    add_index :automation_executions, :status
    add_index :automation_executions, :created_at
  end
end

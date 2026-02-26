class AddMissingFieldsToTickets < ActiveRecord::Migration[7.1]
  def change
    add_column :tickets, :ticket_id,          :string               # auto-generated: TKT-001
    add_column :tickets, :priority,           :string               # low, medium, high, critical
    add_column :tickets, :ticket_type,        :string               # bug, feature, improvement, task
    add_column :tickets, :resolution,         :string               # fixed, wont_fix, duplicate, not_reproducible
    add_column :tickets, :milestone,          :string
    add_column :tickets, :time_spent,         :decimal, precision: 5, scale: 2
    add_column :tickets, :due_date,           :date
    add_column :tickets, :sla_due_date,       :datetime
    add_column :tickets, :actual_result,      :text
    add_column :tickets, :steps_to_reproduce, :text
    add_column :tickets, :environment,        :string
    add_column :tickets, :browser_version,    :string
    add_column :tickets, :os_details,         :string
    add_column :tickets, :duplicate_of_id,    :integer
    add_column :tickets, :resolved_at,        :datetime
    add_column :tickets, :closed_at,          :datetime
    add_column :tickets, :watchers,           :text                 # JSON array of user_ids

    add_index :tickets, :ticket_id, unique: true
    add_index :tickets, :priority
    add_index :tickets, :ticket_type
    add_index :tickets, :due_date
    add_index :tickets, :resolved_at
  end
end

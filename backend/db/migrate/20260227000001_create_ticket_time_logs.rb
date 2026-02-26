class CreateTicketTimeLogs < ActiveRecord::Migration[7.1]
  def change
    create_table :ticket_time_logs do |t|
      t.integer  :ticket_id,   null: false
      t.integer  :user_id,     null: false
      t.decimal  :time_spent,  precision: 6, scale: 2, null: false
      t.text     :description
      t.datetime :logged_at,   null: false
      t.timestamps
    end
    add_index :ticket_time_logs, :ticket_id
    add_index :ticket_time_logs, :user_id
    add_foreign_key :ticket_time_logs, :tickets
    add_foreign_key :ticket_time_logs, :users
  end
end

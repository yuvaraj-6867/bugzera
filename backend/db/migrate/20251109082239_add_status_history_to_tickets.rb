class AddStatusHistoryToTickets < ActiveRecord::Migration[7.1]
  def change
    add_column :tickets, :status_history, :text
  end
end

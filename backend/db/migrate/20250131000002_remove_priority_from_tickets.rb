class RemovePriorityFromTickets < ActiveRecord::Migration[7.1]
  def change
    remove_column :tickets, :priority, :string
  end
end
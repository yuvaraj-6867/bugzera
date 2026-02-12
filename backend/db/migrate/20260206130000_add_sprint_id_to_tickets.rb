class AddSprintIdToTickets < ActiveRecord::Migration[7.1]
  def change
    add_column :tickets, :sprint_id, :integer
    add_index :tickets, :sprint_id
  end
end

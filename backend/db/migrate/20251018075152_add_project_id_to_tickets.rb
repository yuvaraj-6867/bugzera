class AddProjectIdToTickets < ActiveRecord::Migration[7.1]
  def change
    add_reference :tickets, :project, null: true, foreign_key: true
  end
end

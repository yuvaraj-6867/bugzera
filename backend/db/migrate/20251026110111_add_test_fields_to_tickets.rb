class AddTestFieldsToTickets < ActiveRecord::Migration[7.1]
  def change
    add_column :tickets, :test_steps, :text
    add_column :tickets, :expected_result, :text
  end
end

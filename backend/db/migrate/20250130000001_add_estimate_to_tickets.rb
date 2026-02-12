class AddEstimateToTickets < ActiveRecord::Migration[7.1]
  def change
    add_column :tickets, :estimate, :decimal, precision: 5, scale: 2
  end
end
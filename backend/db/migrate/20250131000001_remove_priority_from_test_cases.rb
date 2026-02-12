class RemovePriorityFromTestCases < ActiveRecord::Migration[7.1]
  def change
    remove_column :test_cases, :priority, :integer
  end
end
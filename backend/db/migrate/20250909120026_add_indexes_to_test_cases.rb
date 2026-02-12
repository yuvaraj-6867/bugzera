class AddIndexesToTestCases < ActiveRecord::Migration[7.0]
  def change
    add_index :test_cases, :status
    add_index :test_cases, :created_at
  end
end

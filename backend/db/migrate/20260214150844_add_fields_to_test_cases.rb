class AddFieldsToTestCases < ActiveRecord::Migration[7.1]
  def change
    add_column :test_cases, :priority, :string
    add_column :test_cases, :test_type, :string
    add_column :test_cases, :post_conditions, :text
    add_column :test_cases, :automation_status, :string
    add_column :test_cases, :estimated_duration, :integer
    add_column :test_cases, :tags, :string
  end
end

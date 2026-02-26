class AddMissingFieldsToTestCases < ActiveRecord::Migration[7.1]
  def change
    add_column :test_cases, :test_case_id,        :string           # auto-generated: TC-001
    add_column :test_cases, :actual_results,       :text
    add_column :test_cases, :pass_rate,            :decimal, precision: 5, scale: 2
    add_column :test_cases, :last_executed_at,     :datetime
    add_column :test_cases, :execution_count,      :integer, default: 0
    add_column :test_cases, :flaky_flag,           :boolean, default: false
    add_column :test_cases, :version,              :string, default: '1.0'
    add_column :test_cases, :coverage_percentage,  :decimal, precision: 5, scale: 2
    add_column :test_cases, :parent_test_case_id,  :integer
    add_column :test_cases, :template_id,          :integer
    add_column :test_cases, :automation_script_id, :integer

    add_index :test_cases, :test_case_id, unique: true
    add_index :test_cases, :flaky_flag
    add_index :test_cases, :last_executed_at
    add_index :test_cases, :parent_test_case_id
  end
end

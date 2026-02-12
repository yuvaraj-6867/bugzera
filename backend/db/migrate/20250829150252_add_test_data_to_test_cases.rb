class AddTestDataToTestCases < ActiveRecord::Migration[7.1]
  def change
    add_column :test_cases, :test_data, :text
  end
end

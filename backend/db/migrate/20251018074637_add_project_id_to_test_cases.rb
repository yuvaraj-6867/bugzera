class AddProjectIdToTestCases < ActiveRecord::Migration[7.1]
  def change
    add_reference :test_cases, :project, null: true, foreign_key: true
  end
end

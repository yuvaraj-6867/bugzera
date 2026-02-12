class ChangeTestCaseIdToNullableInTestRuns < ActiveRecord::Migration[7.1]
  def change
    change_column_null :test_runs, :test_case_id, true
  end
end

class AddAutomationScriptToTestRuns < ActiveRecord::Migration[7.1]
  def change
    add_reference :test_runs, :automation_script, null: true, foreign_key: true
  end
end

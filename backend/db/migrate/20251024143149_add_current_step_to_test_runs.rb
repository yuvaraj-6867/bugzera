class AddCurrentStepToTestRuns < ActiveRecord::Migration[7.1]
  def change
    add_column :test_runs, :current_step, :string
  end
end

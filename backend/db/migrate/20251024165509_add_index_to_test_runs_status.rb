class AddIndexToTestRunsStatus < ActiveRecord::Migration[7.1]
  def change
    add_index :test_runs, :status
    add_index :test_runs, [:status, :updated_at]
  end
end

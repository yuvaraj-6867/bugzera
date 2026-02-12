class AddProjectAndSettingsToTestRuns < ActiveRecord::Migration[7.1]
  def change
    add_column :test_runs, :project_id, :integer
    add_column :test_runs, :settings, :text
  end
end

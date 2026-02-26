class AddMissingFieldsToTestRuns < ActiveRecord::Migration[7.1]
  def change
    add_column :test_runs, :started_at,          :datetime
    add_column :test_runs, :completed_at,         :datetime
    add_column :test_runs, :environment_id,       :integer
    add_column :test_runs, :browser_name,         :string
    add_column :test_runs, :browser_version,      :string
    add_column :test_runs, :os_details,           :string
    add_column :test_runs, :screen_resolution,    :string
    add_column :test_runs, :actual_results,       :text
    add_column :test_runs, :screenshots_url,      :text             # JSON array of URLs
    add_column :test_runs, :video_url,            :string
    add_column :test_runs, :execution_logs,       :text
    add_column :test_runs, :performance_metrics,  :text             # JSON
    add_column :test_runs, :failure_reason,       :text
    add_column :test_runs, :is_automated,         :boolean, default: false
    add_column :test_runs, :triggered_by,         :string, default: 'manual'
                                                  # manual, scheduled, ci_cd, webhook
    add_column :test_runs, :repository_url,       :string
    add_column :test_runs, :branch,               :string

    add_index :test_runs, :environment_id
    add_index :test_runs, :is_automated
    add_index :test_runs, :triggered_by
  end
end

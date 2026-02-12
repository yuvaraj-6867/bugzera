class AddSettingsToProjects < ActiveRecord::Migration[7.1]
  def change
    add_column :projects, :repository_url, :string
    add_column :projects, :default_branch, :string
    add_column :projects, :test_timeout, :integer
    add_column :projects, :retry_failed_tests, :integer
    add_column :projects, :parallel_execution, :string
    add_column :projects, :email_notifications, :string
    add_column :projects, :webhook_url, :string
  end
end

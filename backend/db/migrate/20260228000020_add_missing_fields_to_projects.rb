class AddMissingFieldsToProjects < ActiveRecord::Migration[7.1]
  def change
    add_column :projects, :avatar_url,                  :string
    add_column :projects, :visibility,                  :string, default: 'team'
                                                         # private, team, public
    add_column :projects, :repository_type,             :string
                                                         # github, gitlab, bitbucket
    add_column :projects, :max_parallel_jobs,           :integer, default: 1
    add_column :projects, :slack_notifications_enabled, :boolean, default: false
    add_column :projects, :notification_events,         :text    # JSON array of event names
    add_column :projects, :settings_json,               :text    # JSON project settings
    add_column :projects, :integration_config,          :text    # JSON integration configs
    add_column :projects, :created_by_id,               :integer

    add_index :projects, :visibility
    add_index :projects, :created_by_id
  end
end

class CreateIntegrations < ActiveRecord::Migration[7.1]
  def change
    create_table :integrations do |t|
      t.string :name
      t.text :description
      t.string :integration_type
      t.string :status
      t.integer :project_id
      t.string :auth_type
      t.text :api_key
      t.string :username
      t.string :password_digest
      t.string :base_url
      t.string :webhook_url
      t.string :secret_token
      t.boolean :auto_sync
      t.integer :sync_interval
      t.json :config_settings
      t.json :event_types

      t.timestamps
    end
  end
end

class CreateEnvironmentConfigurations < ActiveRecord::Migration[7.1]
  def change
    create_table :environment_configurations do |t|
      t.integer :environment_id, null: false
      t.string  :config_type,    null: false   # browser, device, os
      t.string  :name,           null: false   # e.g. "Chrome 120", "iPhone 14"
      t.string  :version
      t.text    :settings                      # JSON additional settings
      t.boolean :is_active,      default: true

      t.timestamps
    end
    add_index :environment_configurations, :environment_id
    add_index :environment_configurations, :config_type
  end
end

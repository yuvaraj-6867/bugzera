class CreateEnvironments < ActiveRecord::Migration[7.1]
  def change
    create_table :environments do |t|
      t.string :name
      t.text :description
      t.string :environment_type
      t.string :status
      t.string :base_url
      t.string :health_check_url
      t.integer :project_id
      t.text :database_connection
      t.text :environment_variables
      t.string :api_key
      t.string :secret_key
      t.text :target_devices
      t.json :browser_matrix

      t.timestamps
    end
  end
end

class CreateTestDataSets < ActiveRecord::Migration[7.1]
  def change
    create_table :test_data_sets do |t|
      t.string :name
      t.text :description
      t.integer :project_id
      t.integer :environment_id
      t.string :data_type
      t.string :version
      t.text :data_content
      t.string :generation_method
      t.integer :template_id
      t.integer :records_count
      t.boolean :is_active
      t.boolean :mask_sensitive
      t.string :tags
      t.json :data_schema

      t.timestamps
    end
  end
end

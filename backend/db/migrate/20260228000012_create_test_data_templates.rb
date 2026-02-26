class CreateTestDataTemplates < ActiveRecord::Migration[7.1]
  def change
    create_table :test_data_templates do |t|
      t.string  :name,             null: false
      t.text    :description
      t.text    :template_schema               # JSON field definitions
      t.text    :generation_rules              # JSON faker rules per field
      t.integer :created_by_id,    null: false

      t.timestamps
    end
    add_index :test_data_templates, :created_by_id
  end
end

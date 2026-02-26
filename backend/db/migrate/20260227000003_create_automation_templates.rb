class CreateAutomationTemplates < ActiveRecord::Migration[7.1]
  def change
    create_table :automation_templates do |t|
      t.string  :name,        null: false
      t.text    :description
      t.string  :category
      t.text    :script_content
      t.string  :framework
      t.string  :language
      t.boolean :is_public,   default: false
      t.integer :user_id
      t.string  :tags
      t.integer :usage_count, default: 0
      t.timestamps
    end
    add_index :automation_templates, :user_id
    add_index :automation_templates, :category
  end
end

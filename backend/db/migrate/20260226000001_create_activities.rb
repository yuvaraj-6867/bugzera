class CreateActivities < ActiveRecord::Migration[7.1]
  def change
    create_table :activities do |t|
      t.string   :action, null: false
      t.string   :trackable_type
      t.integer  :trackable_id
      t.integer  :owner_id, null: false
      t.string   :key
      t.text     :parameters
      t.string   :project_context
      t.integer  :project_id
      t.timestamps
    end
    add_index :activities, [:trackable_type, :trackable_id]
    add_index :activities, :owner_id
    add_index :activities, :project_id
    add_index :activities, :created_at
  end
end

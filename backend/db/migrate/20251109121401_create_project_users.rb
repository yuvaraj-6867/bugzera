class CreateProjectUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :project_users do |t|
      t.references :project, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :role, default: 'member'

      t.timestamps
    end
    
    add_index :project_users, [:project_id, :user_id], unique: true
  end
end

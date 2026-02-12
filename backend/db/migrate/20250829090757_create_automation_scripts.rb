class CreateAutomationScripts < ActiveRecord::Migration[7.1]
  def change
    create_table :automation_scripts do |t|
      t.string :name
      t.text :description
      t.string :script_path
      t.references :test_case, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :status

      t.timestamps
    end
  end
end

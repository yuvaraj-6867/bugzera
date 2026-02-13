class CreateTestPlans < ActiveRecord::Migration[7.1]
  def change
    create_table :test_plans do |t|
      t.string :name
      t.text :description
      t.string :status
      t.date :start_date
      t.date :end_date
      t.integer :created_by
      t.integer :project_id

      t.timestamps
    end
  end
end

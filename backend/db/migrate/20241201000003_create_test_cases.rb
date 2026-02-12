class CreateTestCases < ActiveRecord::Migration[7.1]
  def change
    create_table :test_cases do |t|
      t.string :title
      t.text :description
      t.text :preconditions
      t.text :steps
      t.text :expected_results
      t.integer :priority
      t.string :status
      t.references :assigned_user, null: true, foreign_key: { to_table: :users }
      t.references :folder, null: true, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end

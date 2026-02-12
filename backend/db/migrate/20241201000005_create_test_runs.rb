class CreateTestRuns < ActiveRecord::Migration[7.1]
  def change
    create_table :test_runs do |t|
      t.references :test_case, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :status
      t.integer :execution_time
      t.text :notes
      t.text :evidence

      t.timestamps
    end
  end
end

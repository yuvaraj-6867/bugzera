class CreateTestCaseLabels < ActiveRecord::Migration[7.1]
  def change
    create_table :test_case_labels do |t|
      t.integer :test_case_id, null: false
      t.integer :label_id, null: false
      t.timestamps
    end
    add_index :test_case_labels, :test_case_id
    add_index :test_case_labels, :label_id
    add_index :test_case_labels, [:test_case_id, :label_id], unique: true
  end
end

class CreateTestDataSnapshots < ActiveRecord::Migration[7.1]
  def change
    create_table :test_data_snapshots do |t|
      t.integer :test_data_set_id, null: false
      t.string  :version,          null: false
      t.text    :data_content                   # snapshot of data_content at this version
      t.text    :change_summary
      t.integer :created_by_id,    null: false

      t.timestamps
    end
    add_index :test_data_snapshots, :test_data_set_id
    add_index :test_data_snapshots, :created_by_id
  end
end

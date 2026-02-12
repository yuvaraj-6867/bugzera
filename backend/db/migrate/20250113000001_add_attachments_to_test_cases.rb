class AddAttachmentsToTestCases < ActiveRecord::Migration[7.1]
  def change
    create_table :test_case_attachments do |t|
      t.references :test_case, null: false, foreign_key: true
      t.string :filename, null: false
      t.string :content_type, null: false
      t.integer :file_size, null: false
      t.string :attachment_type, null: false # 'image' or 'video'
      t.timestamps
    end

    add_index :test_case_attachments, [:test_case_id, :attachment_type]
  end
end
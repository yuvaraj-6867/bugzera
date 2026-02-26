class CreateDocumentVersions < ActiveRecord::Migration[7.1]
  def change
    create_table :document_versions do |t|
      t.integer :document_id,    null: false
      t.string  :version_number, null: false   # e.g. "1.0", "1.1", "2.0"
      t.text    :change_summary
      t.string  :file_path
      t.integer :file_size
      t.integer :created_by_id,  null: false

      t.timestamps
    end
    add_index :document_versions, :document_id
    add_index :document_versions, :created_by_id
  end
end

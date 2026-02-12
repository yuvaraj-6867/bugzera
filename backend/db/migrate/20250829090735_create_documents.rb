class CreateDocuments < ActiveRecord::Migration[7.1]
  def change
    create_table :documents do |t|
      t.string :title
      t.text :description
      t.string :file_path
      t.integer :file_size
      t.string :content_type
      t.string :version
      t.references :folder, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.text :tags

      t.timestamps
    end
  end
end

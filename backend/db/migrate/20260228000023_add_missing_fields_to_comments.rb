class AddMissingFieldsToComments < ActiveRecord::Migration[7.1]
  def change
    add_column :comments, :parent_comment_id, :integer   # for threaded replies

    add_index :comments, :parent_comment_id
  end
end

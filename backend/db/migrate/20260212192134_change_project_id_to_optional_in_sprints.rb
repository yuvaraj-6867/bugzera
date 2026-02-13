class ChangeProjectIdToOptionalInSprints < ActiveRecord::Migration[7.1]
  def change
    # Remove foreign key constraint
    remove_foreign_key :sprints, :projects if foreign_key_exists?(:sprints, :projects)

    # Change column to allow NULL
    change_column_null :sprints, :project_id, true

    # Re-add foreign key constraint without NOT NULL requirement
    add_foreign_key :sprints, :projects unless foreign_key_exists?(:sprints, :projects)
  end
end

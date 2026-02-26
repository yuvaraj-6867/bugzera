class AddMissingFieldsToProjectUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :project_users, :joined_at,        :datetime
    add_column :project_users, :invited_by_id,    :integer
    add_column :project_users, :last_activity_at, :datetime

    add_index :project_users, :invited_by_id
  end
end

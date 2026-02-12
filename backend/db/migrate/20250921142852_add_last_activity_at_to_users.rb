class AddLastActivityAtToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :last_activity_at, :datetime
  end
end

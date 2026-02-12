class AddPasswordChangedToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :password_changed, :boolean
  end
end

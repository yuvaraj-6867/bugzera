class RemoveNamesFromUserInvitations < ActiveRecord::Migration[7.1]
  def change
    remove_column :user_invitations, :first_name, :string
    remove_column :user_invitations, :last_name, :string
  end
end

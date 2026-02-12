class AddNamesToUserInvitations < ActiveRecord::Migration[7.1]
  def change
    add_column :user_invitations, :first_name, :string
    add_column :user_invitations, :last_name, :string
  end
end

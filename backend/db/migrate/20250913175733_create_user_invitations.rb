class CreateUserInvitations < ActiveRecord::Migration[7.1]
  def change
    create_table :user_invitations do |t|
      t.string :email
      t.string :status, default: 'pending'
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.string :role

      t.timestamps
    end
  end
end

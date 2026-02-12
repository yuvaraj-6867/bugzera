class CreateInvitations < ActiveRecord::Migration[7.1]
  def change
    create_table :invitations do |t|
      t.string :email, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :role, null: false
      t.string :token, null: false
      t.integer :status, default: 0
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end
    
    add_index :invitations, :email
    add_index :invitations, :token, unique: true
    add_index :invitations, :status
  end
end
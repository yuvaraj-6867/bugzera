class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :email
      t.string :password_digest
      t.string :first_name
      t.string :last_name
      t.string :role
      t.string :status
      t.string :phone
      t.string :location
      t.date :joined_date

      t.timestamps
    end
  end
end

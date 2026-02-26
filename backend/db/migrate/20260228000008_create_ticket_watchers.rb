class CreateTicketWatchers < ActiveRecord::Migration[7.1]
  def change
    create_table :ticket_watchers do |t|
      t.integer :ticket_id, null: false
      t.integer :user_id,   null: false

      t.timestamps
    end
    add_index :ticket_watchers, [:ticket_id, :user_id], unique: true
    add_index :ticket_watchers, :ticket_id
    add_index :ticket_watchers, :user_id
  end
end

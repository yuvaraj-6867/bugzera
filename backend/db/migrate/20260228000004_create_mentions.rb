class CreateMentions < ActiveRecord::Migration[7.1]
  def change
    create_table :mentions do |t|
      t.integer :user_id,          null: false   # user who was mentioned
      t.integer :mentioned_by_id,  null: false   # user who mentioned
      t.string  :mentionable_type                # polymorphic: Comment, Ticket, etc.
      t.integer :mentionable_id
      t.boolean :read,             default: false

      t.timestamps
    end
    add_index :mentions, :user_id
    add_index :mentions, :mentioned_by_id
    add_index :mentions, [:mentionable_type, :mentionable_id]
    add_index :mentions, :read
  end
end

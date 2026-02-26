class CreateTicketRelationships < ActiveRecord::Migration[7.1]
  def change
    create_table :ticket_relationships do |t|
      t.integer :ticket_id, null: false
      t.integer :related_ticket_id, null: false
      t.string  :relationship_type, null: false
      t.integer :created_by_id
      t.timestamps
    end
    add_index :ticket_relationships, :ticket_id
    add_index :ticket_relationships, :related_ticket_id
    add_index :ticket_relationships, [:ticket_id, :related_ticket_id, :relationship_type],
              unique: true,
              name: 'idx_ticket_relationships_unique'
  end
end

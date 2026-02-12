class CreateTicketLabels < ActiveRecord::Migration[7.1]
  def change
    create_table :ticket_labels do |t|
      t.references :ticket, null: false, foreign_key: true
      t.references :label, null: false, foreign_key: true

      t.timestamps
    end
  end
end

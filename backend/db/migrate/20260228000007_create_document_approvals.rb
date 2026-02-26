class CreateDocumentApprovals < ActiveRecord::Migration[7.1]
  def change
    create_table :document_approvals do |t|
      t.integer :document_id,  null: false
      t.integer :reviewer_id,  null: false
      t.string  :status,       null: false, default: 'pending'  # pending, approved, rejected
      t.text    :comments
      t.datetime :reviewed_at

      t.timestamps
    end
    add_index :document_approvals, :document_id
    add_index :document_approvals, :reviewer_id
    add_index :document_approvals, :status
  end
end

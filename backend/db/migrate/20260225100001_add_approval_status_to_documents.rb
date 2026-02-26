class AddApprovalStatusToDocuments < ActiveRecord::Migration[7.1]
  def change
    add_column :documents, :approval_status, :string, default: 'draft', null: false
    add_column :documents, :reviewed_by_id, :bigint
    add_column :documents, :reviewed_at, :datetime
  end
end

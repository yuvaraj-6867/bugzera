class AddProjectAndLabelableToLabels < ActiveRecord::Migration[7.1]
  def change
    add_column :labels, :project_id, :integer unless column_exists?(:labels, :project_id)
    add_column :labels, :labelable_type, :string unless column_exists?(:labels, :labelable_type)
    add_column :labels, :labelable_id, :integer unless column_exists?(:labels, :labelable_id)
    add_index :labels, :project_id unless index_exists?(:labels, :project_id)
    add_index :labels, [:labelable_type, :labelable_id] unless index_exists?(:labels, [:labelable_type, :labelable_id])
  end
end

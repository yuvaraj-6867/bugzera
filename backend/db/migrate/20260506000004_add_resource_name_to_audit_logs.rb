class AddResourceNameToAuditLogs < ActiveRecord::Migration[7.1]
  def change
    add_column :audit_logs, :resource_name, :string
  end
end

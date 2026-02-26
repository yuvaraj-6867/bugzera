class AddMissingFieldsToEnvironments < ActiveRecord::Migration[7.1]
  def change
    add_column :environments, :health_status,        :string, default: 'unknown'
                                                      # healthy, degraded, down, unknown
    add_column :environments, :last_health_check_at, :datetime
    add_column :environments, :created_by_id,        :integer

    add_index :environments, :health_status
  end
end

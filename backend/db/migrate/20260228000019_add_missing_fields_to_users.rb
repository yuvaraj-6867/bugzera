class AddMissingFieldsToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :bio,                  :text
    add_column :users, :title,                :string        # job title
    add_column :users, :department,           :string
    add_column :users, :email_verified,       :boolean, default: false
    add_column :users, :email_verified_at,    :datetime
    add_column :users, :dashboard_layout,     :text          # JSON widget layout
    add_column :users, :last_login_at,        :datetime
    add_column :users, :login_count,          :integer, default: 0
    add_column :users, :failed_login_attempts,:integer, default: 0
    add_column :users, :locked_at,            :datetime
    add_column :users, :api_key,              :string
    add_column :users, :api_key_last_used_at, :datetime

    add_index :users, :api_key, unique: true
    add_index :users, :email_verified
    add_index :users, :locked_at
  end
end

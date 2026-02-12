class CreateUserCalls < ActiveRecord::Migration[7.0]
  def change
    create_table :user_calls do |t|
      t.references :caller, null: false, foreign_key: { to_table: :users }
      t.references :receiver, null: false, foreign_key: { to_table: :users }
      t.references :test_case, null: true, foreign_key: true
      t.string :status, default: 'initiated'
      t.string :call_type
      t.datetime :started_at
      t.datetime :ended_at
      t.text :notes

      t.timestamps
    end

    add_index :user_calls, [:caller_id, :receiver_id]
    add_index :user_calls, :status
  end
end
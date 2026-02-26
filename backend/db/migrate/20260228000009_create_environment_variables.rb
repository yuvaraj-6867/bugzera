class CreateEnvironmentVariables < ActiveRecord::Migration[7.1]
  def change
    create_table :environment_variables do |t|
      t.integer :environment_id, null: false
      t.string  :key,            null: false
      t.text    :value
      t.boolean :is_secret,      default: false   # if true, value is encrypted/masked

      t.timestamps
    end
    add_index :environment_variables, :environment_id
    add_index :environment_variables, [:environment_id, :key], unique: true
  end
end

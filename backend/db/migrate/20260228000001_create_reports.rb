class CreateReports < ActiveRecord::Migration[7.1]
  def change
    create_table :reports do |t|
      t.string  :name,        null: false
      t.string  :report_type
      t.text    :configuration
      t.integer :project_id
      t.integer :created_by_id

      t.timestamps
    end
    add_index :reports, :project_id
    add_index :reports, :created_by_id
    add_index :reports, :report_type
  end
end

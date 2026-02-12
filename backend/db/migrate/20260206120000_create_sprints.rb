class CreateSprints < ActiveRecord::Migration[7.0]
  def change
    create_table :sprints do |t|
      t.string :name, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.string :status, default: 'planned', null: false
      t.references :project, null: false, foreign_key: true

      t.timestamps
    end
  end
end

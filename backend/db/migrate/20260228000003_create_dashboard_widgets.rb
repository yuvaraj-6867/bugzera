class CreateDashboardWidgets < ActiveRecord::Migration[7.1]
  def change
    create_table :dashboard_widgets do |t|
      t.integer :user_id,       null: false
      t.string  :widget_type,   null: false   # metrics, chart, recent_runs, calendar, etc.
      t.text    :configuration               # JSON config
      t.text    :position                    # JSON {x, y, w, h}
      t.boolean :is_visible,    default: true

      t.timestamps
    end
    add_index :dashboard_widgets, :user_id
    add_index :dashboard_widgets, :widget_type
  end
end

class CreateScheduledReports < ActiveRecord::Migration[7.1]
  def change
    create_table :scheduled_reports do |t|
      t.integer :report_id,   null: false
      t.string  :schedule                        # cron expression
      t.text    :recipients                      # JSON array of user_ids / emails
      t.string  :format,      default: 'pdf'    # pdf, excel, csv
      t.boolean :is_active,   default: true
      t.datetime :last_run_at
      t.datetime :next_run_at

      t.timestamps
    end
    add_index :scheduled_reports, :report_id
    add_index :scheduled_reports, :is_active
  end
end

class CreateCalendarEvents < ActiveRecord::Migration[7.1]
  def change
    create_table :calendar_events do |t|
      t.string :title, null: false
      t.text :description
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.string :event_type, null: false # test_cycle, bug_triage, release_review, standup, deadline
      t.string :status, default: 'scheduled' # scheduled, in_progress, completed, cancelled
      t.boolean :all_day, default: false
      t.string :location
      t.text :attendees # JSON array of user IDs
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :eventable, polymorphic: true, null: true # Link to test_case, ticket, etc.
      t.timestamps
    end

    add_index :calendar_events, :start_time
    add_index :calendar_events, :end_time
    add_index :calendar_events, :event_type
    add_index :calendar_events, :status
  end
end
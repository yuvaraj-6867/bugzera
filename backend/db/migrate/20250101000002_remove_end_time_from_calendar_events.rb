class RemoveEndTimeFromCalendarEvents < ActiveRecord::Migration[7.1]
  def change
    remove_column :calendar_events, :end_time, :datetime
  end
end
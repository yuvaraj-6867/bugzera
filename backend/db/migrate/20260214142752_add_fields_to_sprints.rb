class AddFieldsToSprints < ActiveRecord::Migration[7.1]
  def change
    add_column :sprints, :description, :text
    add_column :sprints, :sprint_goal, :text
    add_column :sprints, :team, :string
    add_column :sprints, :capacity, :integer
    add_column :sprints, :target_velocity, :float
    add_column :sprints, :completion_percentage, :integer
    add_column :sprints, :retrospective_notes, :text
    add_column :sprints, :track_burndown, :boolean
    add_column :sprints, :tags, :string
  end
end

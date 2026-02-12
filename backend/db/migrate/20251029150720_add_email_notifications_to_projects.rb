class AddEmailNotificationsToProjects < ActiveRecord::Migration[7.1]
  def change
    add_column :projects, :email_notifications_enabled, :boolean
  end
end

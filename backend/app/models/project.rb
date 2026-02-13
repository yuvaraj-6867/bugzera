class Project < ApplicationRecord
  has_many :test_cases, dependent: :destroy
  has_many :test_runs, dependent: :destroy
  has_many :tickets, dependent: :destroy
  has_many :sprints, dependent: :destroy
  has_many :project_users, dependent: :destroy
  has_many :users, through: :project_users
  
  validates :name, presence: true
  validates :status, presence: true
  
  # Default email notifications to true for new projects
  after_initialize :set_defaults
  
  private
  
  def set_defaults
    self.email_notifications_enabled = true if email_notifications_enabled.nil?
  end
end

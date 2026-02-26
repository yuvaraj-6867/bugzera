class AutomationExecution < ApplicationRecord
  belongs_to :automation_script
  belongs_to :triggered_by, class_name: 'User', foreign_key: :triggered_by_id, optional: true
  belongs_to :environment, optional: true

  validates :status, inclusion: { in: %w[pending running passed failed error] }

  scope :recent, -> { order(created_at: :desc) }
  scope :successful, -> { where(status: 'passed') }
  scope :failed, -> { where(status: %w[failed error]) }
end

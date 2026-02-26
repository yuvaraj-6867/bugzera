class ScheduledReport < ApplicationRecord
  belongs_to :report
  belongs_to :created_by, class_name: 'User', foreign_key: :created_by_id, optional: true

  validates :schedule_cron, presence: true

  scope :active, -> { where(is_active: true) }
end

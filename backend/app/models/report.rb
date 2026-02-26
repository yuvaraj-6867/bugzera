class Report < ApplicationRecord
  belongs_to :project, optional: true
  belongs_to :created_by, class_name: 'User', foreign_key: :created_by_id, optional: true

  has_many :scheduled_reports, dependent: :destroy

  validates :name, presence: true
  validates :report_type, presence: true

  scope :by_type, ->(type) { where(report_type: type) }
end

class Ticket < ApplicationRecord
  validates :title, presence: true, length: { maximum: 255 }
  validates :status, inclusion: { in: %w[todo in_progress in_review qa_ready done] }

  belongs_to :assigned_user, class_name: 'User', optional: true
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :project, optional: true
  belongs_to :sprint, optional: true
  belongs_to :test_case, optional: true
  belongs_to :test_run, optional: true
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :ticket_time_logs, dependent: :destroy
  has_many :ticket_relationships, dependent: :destroy
  has_many :ticket_watchers, dependent: :destroy
  has_many :watchers, through: :ticket_watchers, source: :user

  scope :open, -> { where(status: %w[todo in_progress in_review qa_ready]) }
  scope :closed, -> { where(status: 'done') }
  scope :by_status, ->(status) { where(status: status) }

  def open?
    %w[todo in_progress in_review qa_ready].include?(status)
  end

  def closed?
    status == 'done'
  end
end

class Ticket < ApplicationRecord
  validates :title, presence: true, length: { maximum: 255 }
  validates :status, inclusion: { in: %w[open in_progress resolved closed] }

  belongs_to :assigned_user, class_name: 'User', optional: true
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :project, optional: true
  belongs_to :sprint, optional: true
  belongs_to :test_case, optional: true
  belongs_to :test_run, optional: true
  has_many :comments, as: :commentable, dependent: :destroy

  scope :open, -> { where(status: %w[open in_progress]) }
  scope :closed, -> { where(status: %w[resolved closed]) }
  scope :by_status, ->(status) { where(status: status) }

  def open?
    %w[open in_progress].include?(status)
  end

  def closed?
    %w[resolved closed].include?(status)
  end
end

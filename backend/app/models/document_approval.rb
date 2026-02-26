class DocumentApproval < ApplicationRecord
  belongs_to :document
  belongs_to :reviewer, class_name: 'User', foreign_key: :reviewer_id

  validates :status, inclusion: { in: %w[pending approved rejected] }

  scope :pending, -> { where(status: 'pending') }
  scope :approved, -> { where(status: 'approved') }
end

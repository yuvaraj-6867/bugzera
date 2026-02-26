class DocumentVersion < ApplicationRecord
  belongs_to :document
  belongs_to :created_by, class_name: 'User', foreign_key: :created_by_id, optional: true

  validates :version_number, presence: true

  scope :recent, -> { order(created_at: :desc) }
end

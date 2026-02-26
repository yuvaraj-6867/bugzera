class TestDataSnapshot < ApplicationRecord
  belongs_to :test_data_set
  belongs_to :created_by, class_name: 'User', foreign_key: :created_by_id, optional: true

  validates :version, presence: true

  scope :recent, -> { order(created_at: :desc) }
end

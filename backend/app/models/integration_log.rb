class IntegrationLog < ApplicationRecord
  belongs_to :integration

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :successful, -> { where(status: 'success') }
  scope :failed, -> { where(status: 'error') }
end

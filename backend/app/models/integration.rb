class Integration < ApplicationRecord
  validates :name, presence: true
  validates :integration_type, presence: true
  validates :status, inclusion: { in: %w[active inactive error], allow_blank: true }

  belongs_to :project, optional: true
end

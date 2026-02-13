class Environment < ApplicationRecord
  validates :name, presence: true
  validates :status, inclusion: { in: %w[active inactive staging], allow_blank: true }

  belongs_to :project, optional: true
end

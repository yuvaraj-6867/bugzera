class Environment < ApplicationRecord
  validates :name, presence: true
  validates :status, inclusion: { in: %w[active inactive staging], allow_blank: true }

  belongs_to :project, optional: true
  has_many :environment_variables, dependent: :destroy
  has_many :environment_configurations, dependent: :destroy
end

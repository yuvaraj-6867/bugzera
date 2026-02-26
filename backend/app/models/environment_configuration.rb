class EnvironmentConfiguration < ApplicationRecord
  belongs_to :environment

  validates :name, presence: true
  validates :config_type, presence: true

  scope :active, -> { where(is_active: true) }
  scope :by_type, ->(type) { where(config_type: type) }
end

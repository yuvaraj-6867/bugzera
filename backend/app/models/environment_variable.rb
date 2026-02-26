class EnvironmentVariable < ApplicationRecord
  belongs_to :environment

  validates :key, presence: true
  validates :key, uniqueness: { scope: :environment_id }

  def display_value
    is_secret ? '••••••••' : value
  end
end

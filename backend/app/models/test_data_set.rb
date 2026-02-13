class TestDataSet < ApplicationRecord
  validates :name, presence: true
  validates :data_type, inclusion: { in: %w[json csv sql api], allow_blank: true }

  belongs_to :project, optional: true
  belongs_to :environment, optional: true
end

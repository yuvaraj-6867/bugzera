class Sprint < ApplicationRecord
  belongs_to :project

  validates :name, presence: true
  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :status, inclusion: { in: %w[planned active completed] }
end

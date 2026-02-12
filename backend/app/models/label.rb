class Label < ApplicationRecord
  validates :name, presence: true, uniqueness: { scope: :project_id }, length: { maximum: 50 }
  validates :color, presence: true, format: { with: /\A#[0-9A-Fa-f]{6}\z/ }

  belongs_to :project, optional: true
  belongs_to :labelable, polymorphic: true

  scope :by_name, -> { order(:name) }
  scope :for_tickets, -> { where(labelable_type: 'Ticket') }
  scope :for_test_cases, -> { where(labelable_type: 'TestCase') }

  def usage_count
    Label.where(name: name, project: project).count
  end
end
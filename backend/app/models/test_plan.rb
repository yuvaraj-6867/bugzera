class TestPlan < ApplicationRecord
  # Associations
  has_many :test_plan_test_cases, dependent: :destroy
  has_many :test_cases, through: :test_plan_test_cases
  belongs_to :created_by_user, class_name: 'User', foreign_key: 'created_by', optional: true
  belongs_to :project, optional: true

  # Validations
  validates :name, presence: true, length: { minimum: 3, maximum: 255 }
  validates :status, inclusion: { in: %w[draft active completed archived] }

  # Scopes
  scope :active, -> { where(status: 'active') }
  scope :completed, -> { where(status: 'completed') }
  scope :recent, -> { order(created_at: :desc) }

  # Callbacks
  before_validation :set_default_status, on: :create
  after_create :generate_test_plan_number

  # Instance methods
  def test_cases_count
    test_cases.count
  end

  def passed_count
    test_cases.where(status: 'passed').count
  end

  def failed_count
    test_cases.where(status: 'failed').count
  end

  def progress_percentage
    return 0 if test_cases_count.zero?
    ((passed_count.to_f / test_cases_count) * 100).round(2)
  end

  def add_test_case(test_case, order = nil)
    execution_order = order || (test_plan_test_cases.maximum(:execution_order) || 0) + 1
    test_plan_test_cases.create!(test_case: test_case, execution_order: execution_order)
  end

  def remove_test_case(test_case)
    test_plan_test_cases.find_by(test_case: test_case)&.destroy
  end

  private

  def set_default_status
    self.status ||= 'draft'
  end

  def generate_test_plan_number
    update_column(:test_plan_number, "TP-#{id.to_s.rjust(2, '0')}")
  end
end

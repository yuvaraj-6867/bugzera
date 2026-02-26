class AutomationScript < ApplicationRecord
  validates :name, presence: true, length: { maximum: 255 }
  validates :script_path, presence: true
  validates :status, inclusion: { in: %w[draft active inactive] }

  belongs_to :test_case, optional: true
  belongs_to :user, optional: true
  has_many :test_runs, dependent: :nullify
  has_many :automation_executions, dependent: :destroy
  has_one_attached :script_file

  scope :active, -> { where(status: 'active') }
  scope :by_test_case, ->(test_case_id) { where(test_case_id: test_case_id) }

  def execute_async
    AutomationExecutionJob.perform_later(self)
  end

  def last_execution
    test_runs.order(created_at: :desc).first
  end

  def success_rate
    return 0 if test_runs.empty?
    
    passed_runs = test_runs.where(status: 'passed').count
    (passed_runs.to_f / test_runs.count * 100).round(2)
  end
end
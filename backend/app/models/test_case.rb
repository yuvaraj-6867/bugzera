# app/models/test_case.rb (add this line)
class TestCase < ApplicationRecord
  validates :title, presence: true, length: { maximum: 255 }
  validates :status, inclusion: { in: %w[draft active in_progress passed failed archived] }

  belongs_to :assigned_user, class_name: 'User', optional: true
  belongs_to :folder, optional: true
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :project, optional: true
  has_many :test_runs, dependent: :destroy
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :automation_scripts, dependent: :destroy
  has_many :test_case_attachments, dependent: :destroy
  has_many :test_plan_test_cases, dependent: :destroy
  has_many :test_plans, through: :test_plan_test_cases

  scope :active, -> { where.not(status: 'archived') }

  scope :by_status, ->(status) { where(status: status) }

  def latest_run
    test_runs.order(created_at: :desc).first
  end

  def pass_rate
    return 0 if test_runs.empty?
    
    passed_runs = test_runs.where(status: 'passed').count
    (passed_runs.to_f / test_runs.count * 100).round(2)
  end

  def automated?
    automation_scripts.where(status: 'active').exists? rescue false
  end

  def update_status_from_run(run_status)
    case run_status
    when 'passed'
      update(status: 'passed')
    when 'failed'
      update(status: 'failed')
    end
  end
end

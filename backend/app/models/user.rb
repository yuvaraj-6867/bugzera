class User < ApplicationRecord
  has_secure_password

  ROLES = %w[member manager admin developer viewer].freeze

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :first_name, :last_name, presence: true
  validates :role, inclusion: { in: ROLES }
  validates :status, inclusion: { in: %w[active inactive] }

  after_initialize :set_defaults

  has_many :created_test_cases, class_name: 'TestCase', foreign_key: 'created_by_id'
  has_many :assigned_test_cases, class_name: 'TestCase', foreign_key: 'assigned_user_id'
  has_many :created_tickets, class_name: 'Ticket', foreign_key: 'created_by_id'
  has_many :assigned_tickets, class_name: 'Ticket', foreign_key: 'assigned_user_id'
  has_many :test_runs
  has_many :notifications, dependent: :destroy
  has_one :user_setting, dependent: :destroy
  has_many :project_users, dependent: :destroy
  has_many :projects, through: :project_users
  has_many :ticket_watchers, dependent: :destroy
  has_many :watched_tickets, through: :ticket_watchers, source: :ticket
  has_many :mentions, dependent: :destroy
  has_many :activities, dependent: :destroy
  has_many :dashboard_widgets, dependent: :destroy


  scope :active, -> { where(status: 'active') }

  def setting
    user_setting || build_user_setting(UserSetting.default_settings)
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def admin?
    role == 'admin'
  end

  def manager?
    role == 'manager'
  end

  def member?
    role == 'member'
  end

  def developer?
    role == 'developer'
  end

  def viewer?
    role == 'viewer'
  end

  def read_only?
    viewer?
  end

  def can_access?(feature)
    permissions = {
      'member'    => %w[dashboard projects test-cases test-runs tickets sprints documents calendar analytics users settings],
      'manager'   => %w[dashboard projects test-cases test-runs tickets sprints documents calendar analytics users settings environments test-data integrations knowledge-base],
      'admin'     => %w[dashboard projects test-cases test-runs tickets sprints documents calendar analytics users settings environments test-data integrations knowledge-base automation],
      'developer' => %w[dashboard projects test-cases test-runs tickets sprints documents calendar analytics users],
      'viewer'    => %w[dashboard projects test-cases test-runs tickets sprints documents calendar analytics users]
    }
    permissions[role]&.include?(feature.to_s) || false
  end

  def accessible_projects
    admin? ? Project.all : projects
  end

  # ── Account Lockout ────────────────────────────────────────────────────────
  def locked?
    locked_at.present? && locked_at > 30.minutes.ago
  end

  def lock!
    update_columns(locked_at: Time.current)
  end

  def unlock!
    update_columns(locked_at: nil, failed_login_attempts: 0)
  end

  def increment_failed!
    n = (failed_login_attempts || 0) + 1
    update_columns(failed_login_attempts: n)
    lock! if n >= 5
  end

  def reset_failed!
    update_columns(failed_login_attempts: 0, locked_at: nil, last_login_at: Time.current)
  end

  private

  def set_defaults
    self.status ||= 'active'
  end
end

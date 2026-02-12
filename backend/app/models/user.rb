class User < ApplicationRecord
  has_secure_password

  ROLES = %w[member manager admin].freeze

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

  # Permission methods
  def can_access?(feature)
    permissions = {
      'member' => %w[dashboard test-cases tickets],
      'manager' => %w[dashboard test-cases tickets documents],
      'admin' => %w[dashboard projects test-cases automation tickets documents analytics users test-run-history]
    }
    # All users can access dashboard
    return true if feature.to_s == 'dashboard'
    permissions[role]&.include?(feature.to_s) || false
  end

  def accessible_projects
    if admin?
      Project.all
    else
      projects
    end
  end



  private

  def set_defaults
    self.status ||= 'active'
  end
end

class Invitation < ApplicationRecord
  belongs_to :invited_by, class_name: 'User'
  
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :role, presence: true, inclusion: { in: User::ROLES }
  validates :first_name, :last_name, presence: true
  
  enum status: { pending: 0, accepted: 1, expired: 2 }
  
  before_create :generate_token
  
  scope :pending, -> { where(status: :pending) }
  scope :recent, -> { order(created_at: :desc) }
  
  def expired?
    created_at < 7.days.ago
  end
  
  def accept!(user_params)
    transaction do
      user = User.create!(
        email: email,
        first_name: first_name,
        last_name: last_name,
        role: role,
        status: 'active',
        **user_params
      )
      
      update!(status: :accepted)
      user
    end
  end
  
  private
  
  def generate_token
    self.token = SecureRandom.urlsafe_base64(32)
  end
end
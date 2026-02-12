class UserCall < ApplicationRecord
  validates :caller_id, presence: true
  validates :receiver_id, presence: true
  validates :status, inclusion: { in: %w[initiated ringing answered ended failed] }

  belongs_to :caller, class_name: 'User'
  belongs_to :receiver, class_name: 'User'
  belongs_to :test_case, optional: true

  scope :active, -> { where(status: %w[initiated ringing answered]) }

  def duration
    return 0 unless started_at && ended_at
    ended_at - started_at
  end

  def answer!
    update!(status: 'answered', started_at: Time.current)
  end

  def end_call!
    update!(status: 'ended', ended_at: Time.current)
  end
end
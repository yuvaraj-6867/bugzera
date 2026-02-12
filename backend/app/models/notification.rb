class Notification < ApplicationRecord
  validates :title, presence: true
  validates :message, presence: true
  validates :notification_type, inclusion: { in: %w[info success warning error] }

  belongs_to :user
  belongs_to :notifiable, polymorphic: true, optional: true

  scope :unread, -> { where(read: false) }
  scope :recent, -> { order(created_at: :desc) }

  def mark_as_read!
    update!(read: true)
  end
end
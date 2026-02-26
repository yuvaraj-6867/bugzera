class NotificationPreference < ApplicationRecord
  belongs_to :user

  DIGEST_MODES = %w[immediate hourly daily weekly].freeze

  validates :email_digest_mode, inclusion: { in: DIGEST_MODES }

  def self.for_user(user)
    find_or_create_by(user: user)
  end
end

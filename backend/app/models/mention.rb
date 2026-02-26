class Mention < ApplicationRecord
  belongs_to :user
  belongs_to :mentioned_by, class_name: 'User', foreign_key: :mentioned_by_id
  belongs_to :mentionable, polymorphic: true

  scope :unread, -> { where(read: false) }
  scope :for_user, ->(user) { where(user_id: user.id) }
end

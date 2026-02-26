class DashboardWidget < ApplicationRecord
  belongs_to :user

  validates :widget_type, presence: true

  scope :visible, -> { where(is_visible: true) }
  scope :for_user, ->(user) { where(user_id: user.id) }
end

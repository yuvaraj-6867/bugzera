class GoogleCalendarAccount < ApplicationRecord
  belongs_to :user
  validates :email, presence: true, uniqueness: { scope: :user_id }
end

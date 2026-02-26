class TicketWatcher < ApplicationRecord
  belongs_to :ticket
  belongs_to :user

  validates :ticket_id, uniqueness: { scope: :user_id }
end

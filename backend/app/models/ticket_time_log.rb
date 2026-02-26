class TicketTimeLog < ApplicationRecord
  belongs_to :ticket
  belongs_to :user

  validates :time_spent, presence: true, numericality: { greater_than: 0 }
  validates :logged_at,  presence: true

  before_validation :set_logged_at

  def self.total_hours_for(ticket)
    where(ticket: ticket).sum(:time_spent)
  end

  private

  def set_logged_at
    self.logged_at ||= Time.current
  end
end

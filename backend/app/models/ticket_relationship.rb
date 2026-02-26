class TicketRelationship < ApplicationRecord
  TYPES = %w[blocks blocked_by duplicates duplicated_by relates_to].freeze

  belongs_to :ticket
  belongs_to :related_ticket, class_name: 'Ticket'
  belongs_to :created_by, class_name: 'User', optional: true

  validates :relationship_type, inclusion: { in: TYPES }
  validates :related_ticket_id, uniqueness: {
    scope: [:ticket_id, :relationship_type],
    message: 'relationship already exists'
  }
  validate :cannot_relate_to_self

  private

  def cannot_relate_to_self
    errors.add(:related_ticket_id, "can't relate a ticket to itself") if ticket_id == related_ticket_id
  end
end

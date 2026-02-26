class Webhook < ApplicationRecord
  belongs_to :project, optional: true
  has_many :webhook_deliveries, dependent: :destroy

  EVENTS = %w[ticket.created ticket.updated ticket.closed
              test_case.created test_case.updated
              test_run.passed test_run.failed
              sprint.started sprint.completed
              comment.created user.invited].freeze

  validates :name, presence: true
  validates :url,  presence: true, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]) }
end

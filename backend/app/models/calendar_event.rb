class CalendarEvent < ApplicationRecord
  belongs_to :created_by, class_name: 'User'
  belongs_to :eventable, polymorphic: true, optional: true
  has_many :comments, as: :commentable, dependent: :destroy

  validates :title, presence: true
  validates :start_time, presence: true
  validates :event_type, inclusion: { in: %w[test_cycle bug_triage release_review standup deadline retesting leave work_from_home] }
  validates :status, inclusion: { in: %w[scheduled in_progress completed cancelled] }
  


  scope :upcoming, -> { where('start_time > ?', Time.current) }
  scope :past, -> { where('start_time < ?', Time.current) }
  scope :current, -> { where('start_time <= ?', Time.current) }
  scope :by_type, ->(type) { where(event_type: type) }
  scope :for_date_range, ->(start_date, end_date) { where(start_time: start_date..end_date) }

  def attendee_users
    return [] if attendees.blank?
    User.where(id: JSON.parse(attendees))
  end




end
class Activity < ApplicationRecord
  belongs_to :owner, class_name: 'User'
  belongs_to :trackable, polymorphic: true, optional: true
  belongs_to :project, optional: true

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_project, ->(project_id) { where(project_id: project_id) }

  def self.track(action:, owner:, trackable: nil, project_id: nil, key: nil, parameters: nil)
    create(
      action: action,
      owner: owner,
      trackable: trackable,
      project_id: project_id,
      key: key || "#{trackable&.class&.name&.underscore}.#{action}",
      parameters: parameters&.to_json
    )
  end

  def owner_name
    owner&.full_name || 'Unknown User'
  end

  def trackable_name
    return nil unless trackable
    trackable.try(:title) || trackable.try(:name) || "##{trackable.id}"
  end

  def as_json(options = {})
    super(options).merge(
      owner_name: owner_name,
      owner_initials: owner ? "#{owner.first_name[0]}#{owner.last_name[0]}".upcase : '?',
      trackable_name: trackable_name,
      parsed_parameters: parameters ? JSON.parse(parameters) : {}
    )
  rescue
    super(options)
  end
end

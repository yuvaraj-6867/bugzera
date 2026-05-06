class AuditLog < ApplicationRecord
  belongs_to :user, optional: true

  ACTIONS = %w[login logout login_failed password_changed
               user_created user_updated user_deleted invitation_sent role_changed
               project_created project_updated project_deleted
               settings_changed data_exported data_imported
               calendar_event_created calendar_event_updated calendar_event_deleted
               integration_created integration_updated integration_deleted].freeze

  scope :recent, -> { order(created_at: :desc) }

  def self.log(action:, user: nil, resource: nil, changes: nil, request: nil, status: 'success', details: nil)
    create(
      action: action,
      user: user,
      resource_type: resource&.class&.name,
      resource_id: resource&.id,
      resource_name: resource.try(:name) || resource.try(:email) || resource.try(:title),
      changes_made: changes&.to_json,
      ip_address: request&.remote_ip,
      user_agent: request&.user_agent&.truncate(255),
      status: status,
      details: details
    )
  rescue => e
    Rails.logger.error "AuditLog.log failed: #{e.message}"
    nil
  end

  def user_name
    user&.full_name || 'System'
  end
end

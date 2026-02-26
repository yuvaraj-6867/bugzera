class AuditLog < ApplicationRecord
  belongs_to :user, optional: true

  ACTIONS = %w[login logout login_failed password_changed user_created user_updated user_deleted
               project_created project_updated settings_changed invitation_sent
               role_changed data_exported data_imported].freeze

  scope :recent, -> { order(created_at: :desc) }

  def self.log(action:, user: nil, resource: nil, changes: nil, request: nil, status: 'success', details: nil)
    create(
      action: action,
      user: user,
      resource_type: resource&.class&.name,
      resource_id: resource&.id,
      changes_made: changes&.to_json,
      ip_address: request&.remote_ip,
      user_agent: request&.user_agent&.truncate(255),
      status: status,
      details: details
    )
  end

  def user_name
    user&.full_name || 'System'
  end
end

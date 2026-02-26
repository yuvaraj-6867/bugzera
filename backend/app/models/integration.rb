class Integration < ApplicationRecord
  validates :name, presence: true
  validates :integration_type, presence: true
  validates :status, inclusion: { in: %w[active inactive error], allow_blank: true }

  belongs_to :project, optional: true
  has_many :integration_logs, dependent: :destroy

  # Encrypt sensitive credentials at rest (Rails 7.1 ActiveRecord::Encryption)
  # Requires config/credentials.yml.enc keys or env vars:
  #   ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY
  #   ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY
  #   ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT
  encrypts :api_key, :secret_token if ActiveRecord::Encryption.config.primary_key.present?

  # Mask sensitive fields in JSON responses
  def api_key_masked
    api_key.present? ? "#{api_key[0..3]}#{'*' * 12}" : nil
  end
end

require 'net/http'
require 'openssl'

class WebhookService
  TIMEOUT_SECONDS = 10

  # Deliver an event to all active webhooks for a project that subscribe to it.
  # event_type examples: 'ticket.created', 'ticket.updated', 'test_run.completed'
  def self.deliver_event(project_id, event_type, payload = {})
    return unless project_id.present?

    Webhook.where(project_id: project_id, status: 'active').each do |webhook|
      subscribed_events = begin
        JSON.parse(webhook.event_types || '[]')
      rescue
        []
      end

      # Wildcard '*' means subscribe to all; otherwise check exact event or prefix (e.g. 'ticket.*')
      matches = subscribed_events.any? do |e|
        e == '*' || e == event_type || (e.end_with?('.*') && event_type.start_with?(e.chomp('.*')))
      end

      deliver(webhook, event_type, payload) if matches
    rescue => e
      Rails.logger.error "WebhookService error for webhook #{webhook.id}: #{e.message}"
    end
  end

  def self.deliver(webhook, event_type, payload = {})
    body = {
      event:      event_type,
      source:     'BugZera',
      timestamp:  Time.current.iso8601,
      data:       payload
    }.to_json

    signature = generate_signature(webhook.secret_token.to_s, body)

    started_at = Time.current
    http_status = nil
    response_body = nil
    success = false

    begin
      uri  = URI.parse(webhook.url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl      = uri.scheme == 'https'
      http.open_timeout = TIMEOUT_SECONDS
      http.read_timeout = TIMEOUT_SECONDS

      request = Net::HTTP::Post.new(uri.request_uri)
      request['Content-Type']        = 'application/json'
      request['X-BugZera-Event']     = event_type
      request['X-BugZera-Signature'] = signature
      request['X-BugZera-Delivery']  = SecureRandom.uuid
      request.body = body

      response      = http.request(request)
      http_status   = response.code.to_i
      response_body = response.body.to_s.truncate(1000)
      success       = http_status.between?(200, 299)
    rescue => e
      http_status   = 0
      response_body = "Error: #{e.message}"
      success       = false
    end

    # Record delivery
    WebhookDelivery.create!(
      webhook_id:    webhook.id,
      event:         event_type,
      http_status:   http_status,
      request_body:  body.truncate(2000),
      response_body: response_body,
      success:       success,
      duration_ms:   ((Time.current - started_at) * 1000).to_i
    ) rescue nil

    # Update webhook counters
    webhook.update_columns(
      delivery_count:   (webhook.delivery_count || 0) + 1,
      last_triggered_at: Time.current
    ) rescue nil

    success
  end

  private

  def self.generate_signature(secret, body)
    return 'sha256=unsigned' if secret.blank?
    digest = OpenSSL::HMAC.hexdigest('SHA256', secret, body)
    "sha256=#{digest}"
  end
end

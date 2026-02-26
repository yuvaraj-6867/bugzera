class Api::V1::WebhooksController < ApplicationController
  def index
    webhooks = Webhook.all
    webhooks = webhooks.where(project_id: params[:project_id]) if params[:project_id].present?
    render json: { webhooks: webhooks.order(created_at: :desc).as_json(except: [:secret_token]) }
  end

  def create
    webhook = Webhook.new(webhook_params.merge(created_by_id: @current_user.id))
    if webhook.save
      render json: { webhook: webhook.as_json(except: [:secret_token]) }, status: :created
    else
      render json: { error: webhook.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  def update
    webhook = Webhook.find(params[:id])
    if webhook.update(webhook_params)
      render json: { webhook: webhook.as_json(except: [:secret_token]) }
    else
      render json: { error: webhook.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  def destroy
    Webhook.find(params[:id]).destroy
    head :no_content
  end

  def deliveries
    webhook = Webhook.find(params[:id])
    deliveries = webhook.webhook_deliveries.order(created_at: :desc).limit(50)
    render json: { deliveries: deliveries.as_json }
  end

  def test_delivery
    webhook = Webhook.find(params[:id])
    # Simulate a test ping
    begin
      require 'net/http'
      uri = URI.parse(webhook.url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.open_timeout = 5
      http.read_timeout = 10
      request = Net::HTTP::Post.new(uri.path.presence || '/', { 'Content-Type' => 'application/json' })
      request.body = { event: 'ping', source: 'BugZera', timestamp: Time.current }.to_json
      response = http.request(request)
      delivery = webhook.webhook_deliveries.create!(
        event: 'ping',
        http_status: response.code.to_i,
        request_body: request.body,
        response_body: response.body.to_s.truncate(500),
        success: response.code.to_i.between?(200, 299)
      )
      webhook.update(last_triggered_at: Time.current, delivery_count: webhook.delivery_count + 1)
      render json: { success: delivery.success, status: response.code.to_i }
    rescue => e
      render json: { success: false, error: e.message }
    end
  end

  private

  def webhook_params
    params.permit(:name, :url, :secret_token, :active, :project_id, events: [])
  end
end

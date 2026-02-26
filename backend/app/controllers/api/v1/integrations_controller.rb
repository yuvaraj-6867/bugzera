class Api::V1::IntegrationsController < ApplicationController
  before_action :set_integration, only: [:show, :update, :destroy, :health, :sync, :logs]

  def index
    @integrations = Integration.all
    render json: { integrations: @integrations }
  end

  def show
    render json: { integration: @integration }
  end

  def create
    @integration = Integration.new(integration_params)

    if @integration.save
      render json: { integration: @integration }, status: :created
    else
      render json: { errors: @integration.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @integration.update(integration_params)
      render json: { integration: @integration }
    else
      render json: { errors: @integration.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @integration.destroy
    head :no_content
  end

  def health
    render json: {
      id: @integration.id,
      name: @integration.name,
      status: @integration.status,
      last_synced_at: @integration.try(:last_synced_at),
      health: @integration.status == 'active' ? 'healthy' : 'degraded'
    }
  end

  def sync
    if @integration.update(last_synced_at: Time.current) rescue @integration.touch
      render json: { message: 'Sync triggered', last_synced_at: Time.current }
    else
      render json: { error: 'Sync failed' }, status: :unprocessable_entity
    end
  end

  def logs
    logs = IntegrationLog.where(integration_id: @integration.id)
                         .order(created_at: :desc).limit(50) rescue []
    render json: { logs: logs }
  end

  private

  def set_integration
    @integration = Integration.find(params[:id])
  end

  def integration_params
    params.require(:integration).permit(
      :name, :description, :integration_type, :status, :project_id,
      :auth_type, :api_key, :username, :password_digest, :base_url,
      :webhook_url, :secret_token, :auto_sync, :sync_interval,
      config_settings: {}, event_types: {}
    )
  end
end

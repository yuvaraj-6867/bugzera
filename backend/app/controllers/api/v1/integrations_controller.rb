class Api::V1::IntegrationsController < ApplicationController
  skip_before_action :authenticate_request, :check_authorization
  before_action :set_integration, only: [:show, :update, :destroy]

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

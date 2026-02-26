class Api::V1::EnvironmentsController < ApplicationController
  before_action :set_environment, only: [:show, :update, :destroy, :health, :health_check]

  def index
    @environments = Environment.all
    render json: { environments: @environments }
  end

  def show
    render json: { environment: @environment }
  end

  def create
    @environment = Environment.new(environment_params)

    if @environment.save
      render json: { environment: @environment }, status: :created
    else
      render json: { errors: @environment.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @environment.update(environment_params)
      render json: { environment: @environment }
    else
      render json: { errors: @environment.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @environment.destroy
    head :no_content
  end

  def health
    render json: {
      id: @environment.id,
      name: @environment.name,
      health_status: @environment.try(:health_status) || @environment.status,
      last_health_check_at: @environment.try(:last_health_check_at),
      base_url: @environment.base_url
    }
  end

  def health_check
    url = @environment.health_check_url.presence || @environment.base_url
    unless url.present?
      return render json: { status: 'unknown', message: 'No health check URL configured' }
    end
    begin
      require 'net/http'
      uri = URI.parse(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.open_timeout = 5
      http.read_timeout = 10
      response = http.get(uri.path.presence || '/')
      healthy = response.code.to_i.between?(200, 399)
      new_status = healthy ? 'healthy' : 'degraded'
      @environment.update_columns(status: new_status)
      render json: { status: new_status, http_code: response.code.to_i, message: healthy ? 'Environment is reachable' : 'Environment returned an error' }
    rescue => e
      @environment.update_columns(status: 'offline')
      render json: { status: 'offline', message: e.message }
    end
  end

  private

  def set_environment
    @environment = Environment.find(params[:id])
  end

  def environment_params
    params.require(:environment).permit(
      :name, :description, :environment_type, :status, :base_url,
      :health_check_url, :project_id, :database_connection,
      :environment_variables, :api_key, :secret_key, :target_devices,
      browser_matrix: {}
    )
  end
end

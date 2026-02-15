class Api::V1::EnvironmentsController < ApplicationController
  before_action :set_environment, only: [:show, :update, :destroy]

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

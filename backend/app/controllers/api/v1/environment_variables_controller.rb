class Api::V1::EnvironmentVariablesController < ApplicationController
  before_action :set_environment

  def index
    vars = @environment.environment_variables.order(:key)
    render json: {
      environment_variables: vars.map { |v|
        {
          id: v.id,
          key: v.key,
          value: v.is_secret ? '••••••••' : v.value,
          is_secret: v.is_secret,
          environment_id: v.environment_id
        }
      }
    }
  end

  def create
    var = @environment.environment_variables.build(env_var_params)
    if var.save
      render json: { environment_variable: var }, status: :created
    else
      render json: { errors: var.errors }, status: :unprocessable_entity
    end
  end

  def update
    var = @environment.environment_variables.find(params[:id])
    if var.update(env_var_params)
      render json: { environment_variable: var }
    else
      render json: { errors: var.errors }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Variable not found' }, status: :not_found
  end

  def destroy
    var = @environment.environment_variables.find(params[:id])
    var.destroy
    head :no_content
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Variable not found' }, status: :not_found
  end

  private

  def set_environment
    @environment = Environment.find(params[:environment_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Environment not found' }, status: :not_found
  end

  def env_var_params
    params.require(:environment_variable).permit(:key, :value, :is_secret)
  end
end

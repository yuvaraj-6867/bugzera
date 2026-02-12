class Api::V1::AutomationScriptsController < ApplicationController
  before_action :set_automation_script, only: [:show, :update, :destroy, :execute]

  def index
    @scripts = AutomationScript.includes(:test_case, :user)
                              .page(params[:page])
                              .per(params[:per_page] || 20)
    
    @scripts = @scripts.by_test_case(params[:test_case_id]) if params[:test_case_id]
    @scripts = @scripts.where(status: params[:status]) if params[:status]
    
    render json: {
      automation_scripts: @scripts.map { |script| script_json(script) },
      meta: pagination_meta(@scripts)
    }
  end

  def show
    render json: { automation_script: script_json(@automation_script) }
  end

  def create
    @automation_script = AutomationScript.new(script_params)
    @automation_script.user = current_user

    if @automation_script.save
      render json: { automation_script: script_json(@automation_script) }, status: :created
    else
      render json: { errors: @automation_script.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @automation_script.update(script_params)
      render json: { automation_script: script_json(@automation_script) }
    else
      render json: { errors: @automation_script.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @automation_script.destroy
    head :no_content
  end

  def execute
    if @automation_script.status == 'active'
      @automation_script.execute_async
      render json: { message: 'Script execution started', script_id: @automation_script.id }
    else
      render json: { error: 'Script is not active' }, status: :unprocessable_entity
    end
  end

  private

  def set_automation_script
    @automation_script = AutomationScript.find(params[:id])
  end

  def script_params
    params.require(:automation_script).permit(:name, :description, :script_path, :test_case_id, :status, :script_file)
  end

  def script_json(script)
    {
      id: script.id,
      name: script.name,
      description: script.description,
      script_path: script.script_path,
      status: script.status,
      test_case: script.test_case.title,
      created_by: script.user.full_name,
      success_rate: script.success_rate,
      last_execution: script.last_execution&.created_at,
      created_at: script.created_at,
      updated_at: script.updated_at
    }
  end

  def pagination_meta(collection)
    {
      current_page: collection.current_page,
      total_pages: collection.total_pages,
      total_count: collection.total_count,
      per_page: collection.limit_value
    }
  end
end
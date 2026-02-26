class Api::V1::AutomationTemplatesController < ApplicationController
  def index
    templates = AutomationTemplate.where('is_public = ? OR user_id = ?', true, @current_user.id)
    templates = templates.where(category: params[:category]) if params[:category].present?
    render json: { templates: templates.order(usage_count: :desc).as_json }
  end

  def create
    template = AutomationTemplate.new(template_params.merge(user_id: @current_user.id))
    if template.save
      render json: { template: template.as_json }, status: :created
    else
      render json: { error: template.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  def update
    template = AutomationTemplate.find(params[:id])
    if template.update(template_params)
      render json: { template: template.as_json }
    else
      render json: { error: template.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  def destroy
    AutomationTemplate.find(params[:id]).destroy
    head :no_content
  end

  def use
    template = AutomationTemplate.find(params[:id])
    template.increment!(:usage_count)
    render json: { template: template.as_json }
  end

  private

  def template_params
    params.permit(:name, :description, :category, :script_content, :framework, :language, :is_public, :tags)
  end
end

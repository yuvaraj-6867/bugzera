class Api::V1::SprintsController < ApplicationController
  skip_before_action :authenticate_request, :check_authorization
  def index
    sprints = Sprint.all

    if params[:project_id].present?
      sprints = sprints.where(project_id: params[:project_id])
    end

    render json: {
      sprints: sprints.order(start_date: :desc).map { |sprint| sprint_json(sprint) }
    }
  end

  def show
    sprint = Sprint.find(params[:id])
    render json: sprint_json(sprint)
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Sprint not found' }, status: :not_found
  end

  def create
    sprint = Sprint.new(sprint_params)

    if sprint.save
      render json: sprint_json(sprint), status: :created
    else
      render json: { errors: sprint.errors }, status: :unprocessable_entity
    end
  end

  def update
    sprint = Sprint.find(params[:id])

    if sprint.update(sprint_params)
      render json: sprint_json(sprint)
    else
      render json: { errors: sprint.errors }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Sprint not found' }, status: :not_found
  end

  def destroy
    sprint = Sprint.find(params[:id])
    sprint.destroy
    render json: { message: 'Sprint deleted successfully' }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Sprint not found' }, status: :not_found
  end

  private

  def sprint_params
    params.require(:sprint).permit(:name, :start_date, :end_date, :status, :project_id)
  end

  def sprint_json(sprint)
    {
      id: sprint.id,
      name: sprint.name,
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      status: sprint.status,
      project_id: sprint.project_id,
      total_tickets: sprint.tickets.count,
      todo_count: sprint.tickets.where(status: 'todo').count,
      in_progress_count: sprint.tickets.where(status: 'in_progress').count,
      in_review_count: sprint.tickets.where(status: 'in_review').count,
      qa_ready_count: sprint.tickets.where(status: 'qa_ready').count,
      done_count: sprint.tickets.where(status: 'done').count,
      created_at: sprint.created_at,
      updated_at: sprint.updated_at
    }
  end
end

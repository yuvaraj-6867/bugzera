class Api::V1::SprintsController < ApplicationController
  def index
    # Auto-complete active sprints whose end_date has passed
    expired_sprint_ids = Sprint.where(status: 'active').where('end_date < ?', Date.today).pluck(:id)
    if expired_sprint_ids.present?
      Sprint.where(id: expired_sprint_ids).update_all(status: 'completed')
    end

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

    # If new sprint is active, complete any existing active sprints and move incomplete tickets
    if sprint.status == 'active'
      old_active_sprints = Sprint.where(status: 'active').pluck(:id)
      Sprint.where(status: 'active').update_all(status: 'completed')
    end

    if sprint.save
      # Move non-done tickets from old active sprints to the new sprint
      if old_active_sprints.present?
        Ticket.where(sprint_id: old_active_sprints)
              .where.not(status: 'done')
              .update_all(sprint_id: sprint.id)
      end
      render json: sprint_json(sprint), status: :created
    else
      render json: { errors: sprint.errors }, status: :unprocessable_entity
    end
  end

  def update
    sprint = Sprint.find(params[:id])

    # If sprint is being set to active, complete other active sprints and move incomplete tickets
    old_active_sprint_ids = nil
    if sprint_params[:status] == 'active' && sprint.status != 'active'
      old_active_sprint_ids = Sprint.where(status: 'active').where.not(id: sprint.id).pluck(:id)
      Sprint.where(id: old_active_sprint_ids).update_all(status: 'completed')
    end

    if sprint.update(sprint_params)
      # Move non-done tickets from old active sprints to this sprint
      if old_active_sprint_ids.present?
        Ticket.where(sprint_id: old_active_sprint_ids)
              .where.not(status: 'done')
              .update_all(sprint_id: sprint.id)
      end
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
    params.require(:sprint).permit(:name, :description, :start_date, :end_date, :status, :project_id, :sprint_goal, :team, :capacity, :target_velocity, :completion_percentage, :retrospective_notes, :track_burndown, :tags)
  end

  def sprint_json(sprint)
    {
      id: sprint.id,
      name: sprint.name,
      description: sprint.description,
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      status: sprint.status,
      project_id: sprint.project_id,
      sprint_goal: sprint.sprint_goal,
      team: sprint.team,
      capacity: sprint.capacity,
      target_velocity: sprint.target_velocity,
      completion_percentage: sprint.completion_percentage,
      retrospective_notes: sprint.retrospective_notes,
      track_burndown: sprint.track_burndown,
      tags: sprint.tags,
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

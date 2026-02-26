class Api::V1::TicketTimeLogsController < ApplicationController
  before_action :set_ticket

  def index
    logs = @ticket.ticket_time_logs.includes(:user).order(logged_at: :desc)
    render json: {
      ticket_time_logs: logs.map { |l| log_json(l) },
      total_hours: @ticket.ticket_time_logs.sum(:time_spent).to_f.round(2)
    }
  end

  def create
    log = @ticket.ticket_time_logs.new(
      user: @current_user,
      time_spent: time_log_params[:time_spent],
      description: time_log_params[:description],
      logged_at: time_log_params[:logged_at] || Time.current
    )
    if log.save
      render json: { ticket_time_log: log_json(log) }, status: :created
    else
      render json: { error: log.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  def destroy
    log = @ticket.ticket_time_logs.find(params[:id])
    log.destroy
    head :no_content
  end

  private

  def set_ticket
    @ticket = Ticket.find(params[:ticket_id])
  end

  def time_log_params
    params.require(:ticket_time_log).permit(:time_spent, :description, :logged_at)
  end

  def log_json(log)
    {
      id: log.id,
      time_spent: log.time_spent.to_f,
      description: log.description,
      logged_at: log.logged_at,
      user_name: log.user&.full_name,
      created_at: log.created_at
    }
  end
end

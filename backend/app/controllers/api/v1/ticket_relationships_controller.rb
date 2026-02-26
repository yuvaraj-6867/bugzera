class Api::V1::TicketRelationshipsController < ApplicationController
  before_action :set_ticket

  def index
    relationships = @ticket.ticket_relationships.includes(:related_ticket)
    render json: relationships.as_json(include: { related_ticket: { only: [:id, :title, :status, :severity] } })
  end

  def create
    rel = @ticket.ticket_relationships.new(
      related_ticket_id: params[:related_ticket_id],
      relationship_type: params[:relationship_type],
      created_by_id: @current_user.id
    )
    if rel.save
      render json: rel.as_json(include: { related_ticket: { only: [:id, :title, :status, :severity] } }), status: :created
    else
      render json: { error: rel.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  def destroy
    rel = @ticket.ticket_relationships.find(params[:id])
    rel.destroy
    head :no_content
  end

  private

  def set_ticket
    @ticket = Ticket.find(params[:ticket_id])
  end
end

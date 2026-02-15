class Api::V1::UserInvitationsController < ApplicationController
  
  def index
    invitations = UserInvitation.includes(:invited_by).order(created_at: :desc)
    render json: invitations.map { |inv| {
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: 'invited',
      created_at: inv.created_at,
      invited_by: inv.invited_by&.email
    }}
  end
  
  def create
    Rails.logger.info "Creating invitation with params: #{params.inspect}"
    
    inviter = current_user
    
    invitation = UserInvitation.create!(
      email: params[:email],
      role: params[:role],
      invited_by: inviter
    )
    
    render json: { message: 'Invitation sent successfully', invitation: invitation }
  rescue => e
    Rails.logger.error "Invitation creation failed: #{e.message}"
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
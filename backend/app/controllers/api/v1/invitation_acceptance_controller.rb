class Api::V1::InvitationAcceptanceController < ApplicationController
  def show
    invitation = Invitation.find_by(token: params[:token])
    
    if invitation.nil?
      render json: { error: 'Invalid invitation token' }, status: :not_found
      return
    end
    
    if invitation.accepted?
      render json: { error: 'Invitation already accepted' }, status: :unprocessable_entity
      return
    end
    
    if invitation.expired?
      invitation.update(status: :expired)
      render json: { error: 'Invitation has expired' }, status: :unprocessable_entity
      return
    end
    
    render json: {
      invitation: {
        email: invitation.email,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        role: invitation.role,
        invited_by: "#{invitation.invited_by.first_name} #{invitation.invited_by.last_name}"
      }
    }
  end
  
  def create
    invitation = Invitation.find_by(token: params[:token])
    
    if invitation.nil?
      render json: { error: 'Invalid invitation token' }, status: :not_found
      return
    end
    
    if invitation.accepted?
      render json: { error: 'Invitation already accepted' }, status: :unprocessable_entity
      return
    end
    
    if invitation.expired?
      invitation.update(status: :expired)
      render json: { error: 'Invitation has expired' }, status: :unprocessable_entity
      return
    end
    
    begin
      user = invitation.accept!(user_params)
      token = JsonWebToken.encode(user_id: user.id)
      
      render json: {
        message: 'Account created successfully',
        token: token,
        user: user.as_json(only: [:id, :email, :first_name, :last_name, :role, :status])
      }, status: :created
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  private
  
  def user_params
    params.require(:user).permit(:password, :phone, :location)
  end
end
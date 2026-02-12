class Api::V1::AdminController < ApplicationController
  before_action :ensure_admin

  def reset_database
    User.destroy_all
    TestCase.destroy_all
    Ticket.destroy_all
    
    # Run seeds
    load Rails.root.join('db', 'seeds.rb')
    
    render json: { message: 'Database reset successfully' }
  end

  private

  def ensure_admin
    render json: { error: 'Admin access required' }, status: :forbidden unless current_user&.admin?
  end
end
class Api::V1::TicketsController < ApplicationController
  include ProjectAuthorization

  def index
    tickets = Ticket.includes(:assigned_user, :created_by, :sprint)
    
    # Apply project access control only for non-admin users
    unless current_user&.admin?
      accessible_project_ids = current_user&.projects&.pluck(:id) || []
      tickets = tickets.where(project_id: accessible_project_ids)
    end
    
    # Filter by project_id if provided
    if params[:project_id].present?
      tickets = tickets.where(project_id: params[:project_id])
    end
    render json: {
      tickets: tickets.map { |ticket| {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        severity: ticket.severity,
        project_id: ticket.project_id,
        sprint_id: ticket.sprint_id,
        sprint_name: ticket.sprint&.name,
        assigned_user: ticket.assigned_user ? "#{ticket.assigned_user.first_name} #{ticket.assigned_user.last_name}" : 'Unassigned',
        created_by: ticket.created_by ? "#{ticket.created_by.first_name} #{ticket.created_by.last_name}" : nil,
        attachments: ticket.attachments.present? ? JSON.parse(ticket.attachments) : [],
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
      }}
    }
  end

  def show
    ticket = Ticket.includes(:assigned_user, :created_by, :project).find(params[:id])
    
    # Check if user has access to this ticket's project (only for non-admin users)
    unless current_user&.admin? || current_user&.projects&.include?(ticket.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    
    assigned_user_name = 'Unassigned'
    if ticket.assigned_user
      first_name = ticket.assigned_user.first_name || ''
      last_name = ticket.assigned_user.last_name || ''
      assigned_user_name = "#{first_name} #{last_name}".strip
      assigned_user_name = ticket.assigned_user.email if assigned_user_name.empty?
    end
    
    created_by_name = nil
    if ticket.created_by
      first_name = ticket.created_by.first_name || ''
      last_name = ticket.created_by.last_name || ''
      created_by_name = "#{first_name} #{last_name}".strip
      created_by_name = ticket.created_by.email if created_by_name.empty?
    end
    
    render json: {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      severity: ticket.severity,
      project_id: ticket.project_id,
      project_name: ticket.project&.name,
      assigned_user: assigned_user_name,
      assigned_user_id: ticket.assigned_user_id,
      created_by: created_by_name,
      status_history: ticket.status_history,
      attachments: ticket.attachments.present? ? (JSON.parse(ticket.attachments) rescue []) : [],
      created_at: ticket.created_at,
      updated_at: ticket.updated_at
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Ticket not found' }, status: :not_found
  rescue => e
    Rails.logger.error "Error fetching ticket #{params[:id]}: #{e.message}"
    render json: { error: 'Internal server error' }, status: :internal_server_error
  end

  def create
    Rails.logger.info "Full params: #{params.inspect}"
    
    # Get project_id
    project_id = params.dig(:ticket, :project_id)
    project_id = project_id.present? ? project_id.to_i : nil
    
    # Validate project exists, fallback to first accessible project
    if project_id && !Project.exists?(project_id)
      project_id = nil
    end
    
    # If no project_id, assign to first accessible project
    if project_id.nil?
      if current_user&.admin?
        project_id = Project.first&.id
      else
        project_id = current_user&.projects&.first&.id
      end
    end
    
    # Check if user has access to create in the specified project
    unless current_user&.admin? || current_user&.projects&.pluck(:id)&.include?(project_id)
      render json: { error: 'Access denied to this project' }, status: :forbidden
      return
    end
    
    # Find assigned user by name
    assigned_user_name = params.dig(:ticket, :assigned_user)
    assigned_user_id = nil
    
    Rails.logger.info "Assigned user name: '#{assigned_user_name}'"
    
    if assigned_user_name.present? && assigned_user_name != '' && assigned_user_name != 'Assign to'
      # Find user by exact full name match
      assigned_user = User.all.find { |u| "#{u.first_name} #{u.last_name}" == assigned_user_name }
      
      # Fallback: search by email if it's not a full name
      if !assigned_user
        assigned_user = User.find_by(email: assigned_user_name)
      end
      
      assigned_user_id = assigned_user&.id
      Rails.logger.info "Assigned user found: #{assigned_user&.first_name} #{assigned_user&.last_name} (ID: #{assigned_user_id})"
    end
    
    Rails.logger.info "Final assigned_user_id: #{assigned_user_id}"
    
    # Use current user as creator
    creator_id = current_user&.id
    
    Rails.logger.info "Creator ID: #{creator_id}, Project ID: #{project_id}"
    
    sprint_id = params.dig(:ticket, :sprint_id)
    sprint_id = sprint_id.present? ? sprint_id.to_i : nil

    ticket = Ticket.new(ticket_params.except(:assigned_user, :attachments).merge(
      created_by_id: creator_id,
      assigned_user_id: assigned_user_id,
      project_id: project_id,
      sprint_id: sprint_id
    ))
    
    if ticket.save
      # Handle file attachments
      attachments_data = []
      Rails.logger.info "Attachments params: #{params[:ticket][:attachments].inspect}"
      if params[:ticket][:attachments].present?
        params[:ticket][:attachments].each do |file|
          # Store file (simplified - in production use cloud storage)
          filename = "#{Time.current.to_i}_#{file.original_filename}"
          filepath = Rails.root.join('public', 'uploads', filename)
          File.open(filepath, 'wb') { |f| f.write(file.read) }
          
          attachments_data << {
            name: file.original_filename,
            url: "/uploads/#{filename}",
            size: file.size
          }
        end
      end
      
      # Store attachments as JSON in ticket (simplified approach)
      ticket.update(attachments: attachments_data.to_json) if attachments_data.any?
      
      # Reload to get associations
      ticket.reload
      render json: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        severity: ticket.severity,
        project_id: ticket.project_id,
        sprint_id: ticket.sprint_id,
        sprint_name: ticket.sprint&.name,
        assigned_user: ticket.assigned_user ? "#{ticket.assigned_user.first_name} #{ticket.assigned_user.last_name}" : 'Unassigned',
        created_by: ticket.created_by ? "#{ticket.created_by.first_name} #{ticket.created_by.last_name}" : nil,
        attachments: attachments_data,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
      }, status: :created
    else
      render json: { errors: ticket.errors }, status: :unprocessable_entity
    end
  end

  def update
    ticket = Ticket.find(params[:id])
    
    # Check if user has access to this ticket's project (only for non-admin users)
    unless current_user&.admin? || current_user&.projects&.include?(ticket.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    
    old_status = ticket.status
    
    Rails.logger.info "Update params: #{params.inspect}"
    
    # Handle both direct params and nested ticket params
    update_data = params[:ticket] || params.except(:id, :controller, :action, :existing_attachments)
    
    Rails.logger.info "Update data: #{update_data.inspect}"
    
    # Find assigned user by name if provided
    if update_data[:assigned_user].present?
      assigned_user = User.all.find { |u| "#{u.first_name} #{u.last_name}" == update_data[:assigned_user] }
      update_data[:assigned_user_id] = assigned_user&.id
      update_data.delete(:assigned_user)
    end
    
    permitted_params = update_data.except(:attachments, :status_history_entry).permit(:title, :description, :status, :severity, :assigned_user_id, :sprint_id, :status_history)
    Rails.logger.info "Permitted params: #{permitted_params.inspect}"
    # Handle status history
    if update_data[:status_history_entry].present?
      current_history = ticket.status_history || ''
      new_history = current_history.empty? ? update_data[:status_history_entry] : "#{current_history}\n#{update_data[:status_history_entry]}"
      permitted_params = permitted_params.merge(status_history: new_history)
    end
    
    Rails.logger.info "Attempting to update ticket #{ticket.id} with params: #{permitted_params.inspect}"
    
    if ticket.update(permitted_params)
      
      # Handle file attachments
      existing_attachments = []
      if params[:existing_attachments].present?
        existing_attachments = JSON.parse(params[:existing_attachments]) rescue []
      elsif ticket.attachments.present?
        existing_attachments = JSON.parse(ticket.attachments) rescue []
      end
      
      new_attachments = []
      if params[:attachments].present?
        params[:attachments].each do |file|
          # Store file
          filename = "#{Time.current.to_i}_#{file.original_filename}"
          filepath = Rails.root.join('public', 'uploads', filename)
          File.open(filepath, 'wb') { |f| f.write(file.read) }
          
          new_attachments << {
            name: file.original_filename,
            url: "/uploads/#{filename}",
            size: file.size
          }
        end
      end
      
      # Combine existing and new attachments
      all_attachments = existing_attachments + new_attachments
      ticket.update(attachments: all_attachments.to_json) if all_attachments.any?
      
      ticket.reload
      render json: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        severity: ticket.severity,
        project_id: ticket.project_id,
        assigned_user: ticket.assigned_user ? "#{ticket.assigned_user.first_name} #{ticket.assigned_user.last_name}" : 'Unassigned',
        created_by: ticket.created_by ? "#{ticket.created_by.first_name} #{ticket.created_by.last_name}" : nil,
        attachments: all_attachments,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
      }
    else
      render json: { errors: ticket.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    ticket = Ticket.find(params[:id])
    
    # Check if user has access to this ticket's project (only for non-admin users)
    unless current_user&.admin? || current_user&.projects&.include?(ticket.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    
    ticket.destroy
    render json: { message: 'Ticket deleted successfully' }
  end

  private

  def ticket_params
    params.require(:ticket).permit(:title, :description, :status, :severity, :project_id, :sprint_id, :assigned_user, :created_by_id, attachments: [])
  end
  

end
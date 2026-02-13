class Api::V1::DocumentsController < ApplicationController
  skip_before_action :authenticate_request, :check_authorization
  include ProjectAuthorization
  before_action :set_document, only: [:show, :update, :destroy, :download]

  def index
    @documents = Document.includes(:user, :folder, :project)
    
    # Apply project access control only for non-admin users
    unless current_user&.admin?
      accessible_project_ids = current_user&.projects&.pluck(:id) || []
      @documents = @documents.where(project_id: [nil] + accessible_project_ids)
    end
    @documents = @documents.by_folder(params[:folder_id]) if params[:folder_id]
    @documents = @documents.by_tags(params[:tags].split(',')) if params[:tags]
    
    render json: {
      documents: @documents.map { |doc| document_json(doc) }
    }
  rescue => e
    render json: { error: e.message }, status: :internal_server_error
  end

  def show
    # Check if user has access to this document's project (only for non-admin users)
    if @document.project && !current_user&.admin? && !current_user&.projects&.include?(@document.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    
    render json: { document: document_json(@document) }
  end

  def create
    uploaded_file = params[:file]
    return render json: { error: 'No file provided' }, status: :bad_request unless uploaded_file
    
    # Check if user has access to create in the specified project
    project_id = params[:project_id]&.to_i
    if project_id && !current_user&.admin? && !current_user&.projects&.pluck(:id)&.include?(project_id)
      render json: { error: 'Access denied to this project' }, status: :forbidden
      return
    end

    # Save file to public/uploads
    filename = "#{Time.now.to_i}_#{uploaded_file.original_filename}"
    file_path = Rails.root.join('public', 'uploads', filename)
    
    File.open(file_path, 'wb') do |file|
      file.write(uploaded_file.read)
    end

    # Get valid user_id
    user_id = params[:user_id] || User.first&.id
    return render json: { error: 'No users found' }, status: :unprocessable_entity unless user_id

    @document = Document.new(
      title: params[:title] || uploaded_file.original_filename,
      description: params[:description] || '',
      file_path: "/uploads/#{filename}",
      content_type: uploaded_file.content_type,
      file_size: uploaded_file.size,
      version: '1.0',
      user_id: user_id,
      project_id: params[:project_id]
    )

    if @document.save
      render json: { document: document_json(@document) }, status: :created
    else
      File.delete(file_path) if File.exist?(file_path)
      render json: { errors: @document.errors }, status: :unprocessable_entity
    end
  end

  def update
    # Check if user has access to this document's project (only for non-admin users)
    if @document.project && !current_user&.admin? && !current_user&.projects&.include?(@document.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    
    if @document.update(document_params)
      render json: { document: document_json(@document) }
    else
      render json: { errors: @document.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    # Check if user has access to this document's project (only for non-admin users)
    if @document.project && !current_user&.admin? && !current_user&.projects&.include?(@document.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    
    @document.destroy
    head :no_content
  end

  def download
    # Check if user has access to this document's project (only for non-admin users)
    if @document.project && !current_user&.admin? && !current_user&.projects&.include?(@document.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    
    # Remove leading slash from file_path for proper joining
    clean_path = @document.file_path.sub(/^\//,'')
    file_path = Rails.root.join('public', clean_path)
    
    if File.exist?(file_path)
      send_file file_path, filename: @document.title, type: @document.content_type, disposition: 'attachment'
    else
      render json: { error: 'File not found' }, status: :not_found
    end
  end

  private

  def set_document
    @document = Document.find(params[:id])
  end

  def document_params
    params.require(:document).permit(:title, :description, :folder_id, :project_id, :file, tag_list: [])
  end

  def document_json(document)
    {
      id: document.id,
      title: document.title,
      description: document.description,
      file_size: document.file_size_human,
      content_type: document.content_type,
      version: document.version,
      tags: document.tag_list,
      folder: document.folder&.name,
      uploaded_by: document.user.full_name,
      file_url: document.file_path,
      download_url: "/api/v1/documents/#{document.id}/download",
      is_media: document.content_type&.start_with?('image/', 'video/'),
      created_at: document.created_at,
      updated_at: document.updated_at
    }
  end


end
class Api::V1::DocumentsController < ApplicationController
  # Auth enabled - permissions based on user role (manager/admin can access documents)
  include ProjectAuthorization
  before_action :set_document, only: [:show, :update, :destroy, :download, :approve, :reject, :versions, :upload_version]

  def index
    @documents = Document.includes(:user, :folder, :project)

    # Apply project access control only for non-admin users
    unless current_user&.admin?
      accessible_project_ids = current_user&.projects&.pluck(:id) || []
      @documents = @documents.where(project_id: [nil] + accessible_project_ids)
    end
    @documents = @documents.by_folder(params[:folder_id]) if params[:folder_id]
    @documents = @documents.by_tags(params[:tags].split(',')) if params[:tags]

    # Full-text search
    if params[:q].present?
      q = "%#{params[:q]}%"
      @documents = @documents.where('documents.title LIKE ? OR documents.description LIKE ?', q, q)
    end

    render json: {
      documents: @documents.map { |doc| document_json(doc) }
    }
  rescue => e
    render json: { error: e.message }, status: :internal_server_error
  end

  def show
    if @document.project && !current_user&.admin? && !current_user&.projects&.include?(@document.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    render json: { document: document_json(@document) }
  end

  def create
    uploaded_file = params[:file]
    return render json: { error: 'No file provided' }, status: :bad_request unless uploaded_file

    project_id = params[:project_id]&.to_i
    if project_id && !current_user&.admin? && !current_user&.projects&.pluck(:id)&.include?(project_id)
      render json: { error: 'Access denied to this project' }, status: :forbidden
      return
    end

    filename = "#{Time.now.to_i}_#{uploaded_file.original_filename}"
    file_path = Rails.root.join('public', 'uploads', filename)

    File.open(file_path, 'wb') do |file|
      file.write(uploaded_file.read)
    end

    @document = Document.new(
      title: params[:title] || uploaded_file.original_filename,
      description: params[:description] || '',
      file_path: "/uploads/#{filename}",
      content_type: uploaded_file.content_type,
      file_size: uploaded_file.size,
      version: '1.0',
      user_id: current_user.id,
      project_id: params[:project_id],
      tags: params[:tag_list],
      approval_status: 'draft'
    )

    if @document.save
      render json: { document: document_json(@document) }, status: :created
    else
      File.delete(file_path) if File.exist?(file_path)
      render json: { errors: @document.errors }, status: :unprocessable_entity
    end
  end

  def update
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
    if @document.project && !current_user&.admin? && !current_user&.projects&.include?(@document.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    @document.destroy
    head :no_content
  end

  def download
    if @document.project && !current_user&.admin? && !current_user&.projects&.include?(@document.project)
      render json: { error: 'Access denied' }, status: :forbidden
      return
    end
    clean_path = @document.file_path.sub(/^\//,'')
    file_path = Rails.root.join('public', clean_path)
    if File.exist?(file_path)
      send_file file_path, filename: @document.title, type: @document.content_type, disposition: 'attachment'
    else
      render json: { error: 'File not found' }, status: :not_found
    end
  end

  def approve
    unless current_user&.role.in?(%w[admin manager])
      render json: { error: 'Only managers and admins can approve documents' }, status: :forbidden
      return
    end
    @document.update!(approval_status: 'approved', reviewed_by_id: current_user.id, reviewed_at: Time.current)
    render json: { document: document_json(@document) }
  end

  def reject
    unless current_user&.role.in?(%w[admin manager])
      render json: { error: 'Only managers and admins can reject documents' }, status: :forbidden
      return
    end
    @document.update!(approval_status: 'rejected', reviewed_by_id: current_user.id, reviewed_at: Time.current)
    render json: { document: document_json(@document) }
  end

  def versions
    versions = DocumentVersion.where(document_id: @document.id).order(created_at: :desc)
    render json: versions.map { |v| {
      id: v.id, version_number: v.version_number, change_summary: v.change_summary,
      file_size: v.file_size, created_at: v.created_at, created_by_id: v.created_by_id
    }}
  end

  def upload_version
    version_number = params[:version_number] || next_version_number(@document)
    version = DocumentVersion.create!(
      document_id: @document.id,
      version_number: version_number,
      change_summary: params[:change_summary],
      file_path: @document.file_path,
      file_size: @document.file_size,
      created_by_id: current_user.id
    )
    @document.update(version: version_number)
    render json: version, status: :created
  end

  private

  def next_version_number(doc)
    current = doc.version || '1.0'
    parts = current.split('.').map(&:to_i)
    parts[-1] += 1
    parts.join('.')
  end

  def set_document
    @document = Document.find(params[:id])
  end

  def document_params
    params.require(:document).permit(:title, :description, :folder_id, :project_id, :file, :tags, :approval_status, tag_list: [])
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
      approval_status: document.approval_status || 'draft',
      reviewed_at: document.try(:reviewed_at),
      created_at: document.created_at,
      updated_at: document.updated_at
    }
  end
end

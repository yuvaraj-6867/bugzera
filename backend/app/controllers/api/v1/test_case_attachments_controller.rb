class Api::V1::TestCaseAttachmentsController < ApplicationController
  skip_before_action :authenticate_request
  skip_before_action :check_authorization
  before_action :set_test_case
  before_action :set_attachment, only: [:show, :destroy]

  def index
    attachments = @test_case.test_case_attachments.includes(:file_attachment)
    render json: {
      attachments: attachments.map { |att| attachment_json(att) }
    }
  end

  def create
    attachment = @test_case.test_case_attachments.build
    attachment.file.attach(params[:file])
    
    if attachment.save
      render json: { attachment: attachment_json(attachment) }, status: :created
    else
      render json: { errors: attachment.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @attachment.destroy
    head :no_content
  end

  private

  def set_test_case
    @test_case = TestCase.find(params[:test_case_id])
  end

  def set_attachment
    @attachment = @test_case.test_case_attachments.find(params[:id])
  end

  def attachment_json(attachment)
    {
      id: attachment.id,
      filename: attachment.filename,
      content_type: attachment.content_type,
      file_size: attachment.file_size,
      attachment_type: attachment.attachment_type,
      file_url: attachment.file_url,
      created_at: attachment.created_at
    }
  end
end
class Api::V1::CommentsController < ApplicationController
  before_action :set_commentable
  before_action :set_comment, only: [:show, :update, :destroy]

  def index
    @comments = @commentable.comments.includes(:user).recent
    render json: { comments: @comments.map { |comment| comment_json(comment) } }
  end

  def create
    @comment = @commentable.comments.build(comment_params)
    @comment.user = current_user

    if @comment.save
      render json: { comment: comment_json(@comment) }, status: :created
    else
      render json: { errors: @comment.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @comment.update(comment_params)
      render json: { comment: comment_json(@comment) }
    else
      render json: { errors: @comment.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @comment.destroy
    head :no_content
  end

  private

  def set_commentable
    if params[:test_case_id]
      @commentable = TestCase.find(params[:test_case_id])
    elsif params[:ticket_id]
      @commentable = Ticket.find(params[:ticket_id])
    end
  end

  def set_comment
    @comment = @commentable.comments.find(params[:id])
  end

  def comment_params
    params.require(:comment).permit(:content)
  end

  def comment_json(comment)
    {
      id: comment.id,
      content: comment.content,
      author: comment.author_name,
      created_at: comment.created_at,
      updated_at: comment.updated_at
    }
  end
end
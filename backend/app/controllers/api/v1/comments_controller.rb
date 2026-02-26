class Api::V1::CommentsController < ApplicationController
  before_action :set_commentable
  before_action :set_comment, only: [:update, :destroy]

  def index
    @comments = @commentable.comments.includes(:user).recent
    render json: { comments: @comments.map { |comment| comment_json(comment) } }
  end

  def create
    @comment = @commentable.comments.build(comment_params)
    @comment.user = current_user

    if @comment.save
      parse_and_notify_mentions(@comment)
      NotificationService.notify_comment_added(@comment) rescue nil
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

  # Parse @username mentions in comment content, create Mention records, and email
  def parse_and_notify_mentions(comment)
    return unless comment.content.present?

    usernames = comment.content.scan(/@([\w.\-]+)/).flatten.uniq
    return if usernames.empty?

    usernames.each do |username|
      # Try matching by email prefix or first name
      mentioned_user = User.where('email LIKE ?', "#{username}%").first ||
                       User.where('LOWER(first_name) = ?', username.downcase).first
      next unless mentioned_user && mentioned_user != current_user

      Mention.create!(
        user_id:         mentioned_user.id,
        mentioned_by_id: current_user.id,
        mentionable:     comment,
        read:            false
      ) rescue nil

      # In-app notification
      NotificationService.create_notification(
        user:     mentioned_user,
        title:    "You were mentioned",
        message:  "#{current_user.full_name} mentioned you in a comment: \"#{comment.content.truncate(100)}\"",
        type:     'info',
        notifiable: comment
      ) rescue nil

      # Email notification
      prefs = NotificationPreference.for_user(mentioned_user)
      if prefs.email_enabled && prefs.email_mentions
        UserMailer.notification_email(
          mentioned_user.email,
          "@Mention by #{current_user.full_name}",
          "#{current_user.full_name} mentioned you in a comment:\n\n\"#{comment.content}\""
        ).deliver_now rescue nil
      end
    end
  end
end
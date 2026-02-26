class Api::V1::ArticlesController < ApplicationController
  before_action :set_article, only: [:show, :update, :destroy, :feedback]

  def index
    @articles = Article.all.order(display_order: :asc, created_at: :desc)
    render json: { articles: @articles.map { |a| article_json(a) } }
  end

  def show
    # Increment view count
    @article.increment!(:view_count) rescue nil
    render json: { article: article_json(@article) }
  end

  def create
    @article = Article.new(article_params)

    if @article.save
      render json: { article: article_json(@article) }, status: :created
    else
      render json: { errors: @article.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @article.update(article_params)
      render json: { article: article_json(@article) }
    else
      render json: { errors: @article.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @article.destroy
    head :no_content
  end

  def feedback
    helpful = params[:helpful]
    comment = params[:comment].to_s.strip

    existing = ArticleFeedback.find_by(article_id: @article.id, user_id: @current_user.id)
    if existing
      existing.update(helpful: helpful, comment: comment)
    else
      ArticleFeedback.create(article_id: @article.id, user_id: @current_user.id, helpful: helpful, comment: comment)
    end

    render json: { message: 'Feedback recorded' }
  end

  def search
    query = params[:q].to_s.strip
    if query.blank?
      render json: { articles: [] }
      return
    end

    @articles = Article.where(
      'title LIKE :q OR content LIKE :q OR summary LIKE :q', q: "%#{query}%"
    ).order(display_order: :asc, created_at: :desc)

    render json: { articles: @articles.map { |a| article_json(a) } }
  end

  private

  def set_article
    @article = Article.find(params[:id])
  end

  def article_params
    params.require(:article).permit(
      :title, :category, :status, :content, :tags, :visibility,
      :summary, :related_articles, :author_id, :display_order, :user_id
    )
  end

  def article_json(article)
    feedbacks      = ArticleFeedback.where(article_id: article.id)
    helpful_count  = feedbacks.where(helpful: true).count
    not_helpful    = feedbacks.where(helpful: false).count
    user_feedback  = @current_user ? feedbacks.find_by(user_id: @current_user.id) : nil

    article.as_json.merge(
      view_count:        article.try(:view_count) || 0,
      helpful_count:     helpful_count,
      not_helpful_count: not_helpful,
      total_feedback:    helpful_count + not_helpful,
      user_feedback:     user_feedback ? { helpful: user_feedback.helpful, comment: user_feedback.comment } : nil
    )
  end
end

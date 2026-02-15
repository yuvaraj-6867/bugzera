class Api::V1::ArticlesController < ApplicationController
  before_action :set_article, only: [:show, :update, :destroy]

  def index
    @articles = Article.all.order(display_order: :asc, created_at: :desc)
    render json: { articles: @articles }
  end

  def show
    render json: { article: @article }
  end

  def create
    @article = Article.new(article_params)

    if @article.save
      render json: { article: @article }, status: :created
    else
      render json: { errors: @article.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @article.update(article_params)
      render json: { article: @article }
    else
      render json: { errors: @article.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @article.destroy
    head :no_content
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
end

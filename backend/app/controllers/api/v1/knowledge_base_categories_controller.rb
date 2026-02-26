class Api::V1::KnowledgeBaseCategoriesController < ApplicationController
  def index
    categories = KnowledgeBaseCategory.order(:display_order, :name)
    render json: categories
  end

  def show
    category = KnowledgeBaseCategory.find(params[:id])
    render json: category
  end

  def create
    category = KnowledgeBaseCategory.new(category_params)
    if category.save
      render json: category, status: :created
    else
      render json: { errors: category.errors }, status: :unprocessable_entity
    end
  end

  def update
    category = KnowledgeBaseCategory.find(params[:id])
    if category.update(category_params)
      render json: category
    else
      render json: { errors: category.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    KnowledgeBaseCategory.find(params[:id]).destroy
    head :no_content
  end

  private

  def category_params
    params.require(:knowledge_base_category).permit(:name, :description, :parent_id, :icon, :display_order)
  end
end

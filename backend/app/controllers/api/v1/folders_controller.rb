class Api::V1::FoldersController < ApplicationController
  before_action :set_folder, only: [:show, :update, :destroy]

  def index
    folders = Folder.includes(:parent, :children).order(:name)
    render json: folders.as_json(include: [:parent, :children])
  end

  def show
    render json: @folder.as_json(include: [:parent, :children, :test_cases])
  end

  def create
    folder = Folder.new(folder_params)
    
    if folder.save
      render json: folder, status: :created
    else
      render json: { errors: folder.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @folder.update(folder_params)
      render json: @folder
    else
      render json: { errors: @folder.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @folder.destroy
    head :no_content
  end

  private

  def set_folder
    @folder = Folder.find(params[:id])
  end

  def folder_params
    params.permit(:name, :description, :parent_id)
  end
end
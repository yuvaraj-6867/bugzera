class Api::V1::LabelsController < ApplicationController
  before_action :set_label, only: [:show, :update, :destroy]

  def index
    @labels = Label.by_name
    render json: { labels: @labels.map { |label| label_json(label) } }
  end

  def show
    render json: { label: label_json(@label) }
  end

  def create
    @label = Label.new(label_params)

    if @label.save
      render json: { label: label_json(@label) }, status: :created
    else
      render json: { errors: @label.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @label.update(label_params)
      render json: { label: label_json(@label) }
    else
      render json: { errors: @label.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @label.destroy
    head :no_content
  end

  private

  def set_label
    @label = Label.find(params[:id])
  end

  def label_params
    params.require(:label).permit(:name, :color, :description)
  end

  def label_json(label)
    {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      tickets_count: label.tickets_count
    }
  end
end
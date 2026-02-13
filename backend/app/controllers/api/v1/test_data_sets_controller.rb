class Api::V1::TestDataSetsController < ApplicationController
  skip_before_action :authenticate_request, :check_authorization
  before_action :set_test_data_set, only: [:show, :update, :destroy]

  def index
    @test_data_sets = TestDataSet.all
    render json: { test_data_sets: @test_data_sets }
  end

  def show
    render json: { test_data_set: @test_data_set }
  end

  def create
    @test_data_set = TestDataSet.new(test_data_set_params)

    if @test_data_set.save
      render json: { test_data_set: @test_data_set }, status: :created
    else
      render json: { errors: @test_data_set.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @test_data_set.update(test_data_set_params)
      render json: { test_data_set: @test_data_set }
    else
      render json: { errors: @test_data_set.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @test_data_set.destroy
    head :no_content
  end

  private

  def set_test_data_set
    @test_data_set = TestDataSet.find(params[:id])
  end

  def test_data_set_params
    params.require(:test_data_set).permit(
      :name, :description, :project_id, :environment_id, :data_type,
      :version, :data_content, :generation_method, :template_id,
      :records_count, :is_active, :mask_sensitive, :tags,
      data_schema: {}
    )
  end
end

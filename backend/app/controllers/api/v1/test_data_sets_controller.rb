class Api::V1::TestDataSetsController < ApplicationController
  before_action :set_test_data_set, only: [:show, :update, :destroy, :export, :snapshot]

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

  def export
    data = @test_data_set.data_content.presence || '{}'
    send_data data.to_s, type: 'application/json',
              disposition: 'attachment',
              filename: "#{@test_data_set.name.parameterize}.json"
  end

  def snapshot
    snapshot = TestDataSnapshot.create(
      test_data_set_id: @test_data_set.id,
      version: (TestDataSnapshot.where(test_data_set_id: @test_data_set.id).count + 1).to_s,
      data_content: @test_data_set.data_content,
      change_summary: params[:change_summary].to_s,
      created_by_id: current_user.id
    )
    render json: { snapshot: snapshot }, status: :created
  end

  def generate
    render json: {
      message: 'Data generation queued',
      template_id: params[:template_id],
      count: params[:count] || 10
    }
  end

  def import
    render json: { message: 'Import accepted', imported: 0 }
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

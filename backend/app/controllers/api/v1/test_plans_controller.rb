class Api::V1::TestPlansController < ApplicationController
  before_action :set_test_plan, only: [:show, :update, :destroy, :add_test_case, :remove_test_case]

  # GET /api/v1/test_plans
  def index
    test_plans = TestPlan.includes(:test_cases, :created_by_user).recent

    render json: {
      test_plans: test_plans.map { |tp| test_plan_json(tp) }
    }
  end

  # GET /api/v1/test_plans/:id
  def show
    render json: {
      test_plan: test_plan_detail_json(@test_plan)
    }
  end

  # POST /api/v1/test_plans
  def create
    test_plan = TestPlan.new(test_plan_params)
    test_plan.created_by = @current_user&.id

    if test_plan.save
      render json: {
        test_plan: test_plan_json(test_plan),
        message: 'Test plan created successfully'
      }, status: :created
    else
      render json: {
        errors: test_plan.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/test_plans/:id
  def update
    if @test_plan.update(test_plan_params)
      render json: {
        test_plan: test_plan_json(@test_plan),
        message: 'Test plan updated successfully'
      }
    else
      render json: {
        errors: @test_plan.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/test_plans/:id
  def destroy
    @test_plan.destroy
    render json: { message: 'Test plan deleted successfully' }
  end

  # POST /api/v1/test_plans/:id/add_test_case
  def add_test_case
    test_case = TestCase.find(params[:test_case_id])
    execution_order = params[:execution_order]

    begin
      @test_plan.add_test_case(test_case, execution_order)
      render json: {
        message: 'Test case added to plan successfully',
        test_plan: test_plan_detail_json(@test_plan)
      }
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/test_plans/:id/remove_test_case/:test_case_id
  def remove_test_case
    test_case = TestCase.find(params[:test_case_id])
    @test_plan.remove_test_case(test_case)

    render json: {
      message: 'Test case removed from plan successfully',
      test_plan: test_plan_detail_json(@test_plan)
    }
  end

  private

  def set_test_plan
    @test_plan = TestPlan.find(params[:id])
  end

  def test_plan_params
    params.require(:test_plan).permit(
      :name, :description, :status, :start_date, :end_date, :project_id
    )
  end

  def test_plan_json(test_plan)
    {
      id: test_plan.id,
      test_plan_number: test_plan.test_plan_number,
      name: test_plan.name,
      description: test_plan.description,
      status: test_plan.status,
      start_date: test_plan.start_date,
      end_date: test_plan.end_date,
      test_cases_count: test_plan.test_cases_count,
      passed_count: test_plan.passed_count,
      failed_count: test_plan.failed_count,
      progress_percentage: test_plan.progress_percentage,
      created_by: test_plan.created_by_user&.first_name,
      created_at: test_plan.created_at,
      updated_at: test_plan.updated_at
    }
  end

  def test_plan_detail_json(test_plan)
    test_plan_json(test_plan).merge(
      test_cases: test_plan.test_plan_test_cases.includes(:test_case).map do |tptc|
        {
          id: tptc.test_case.id,
          title: tptc.test_case.title,
          status: tptc.test_case.status,
          execution_order: tptc.execution_order,
          test_case_number: "TC-#{tptc.test_case.id.to_s.rjust(3, '0')}"
        }
      end
    )
  end
end

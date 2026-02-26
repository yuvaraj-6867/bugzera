class Api::V1::ScheduledReportsController < ApplicationController
  def index
    scheduled = ScheduledReport.order(created_at: :desc)
    render json: scheduled
  end

  def create
    scheduled = ScheduledReport.new(scheduled_report_params)
    if scheduled.save
      render json: scheduled, status: :created
    else
      render json: { errors: scheduled.errors }, status: :unprocessable_entity
    end
  end

  def update
    scheduled = ScheduledReport.find(params[:id])
    if scheduled.update(scheduled_report_params)
      render json: scheduled
    else
      render json: { errors: scheduled.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    ScheduledReport.find(params[:id]).destroy
    head :no_content
  end

  private

  def scheduled_report_params
    params.require(:scheduled_report).permit(:report_id, :schedule, :recipients, :format, :is_active)
  end
end

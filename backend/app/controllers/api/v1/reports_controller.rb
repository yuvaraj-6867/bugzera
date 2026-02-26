class Api::V1::ReportsController < ApplicationController
  def index
    reports = Report.order(created_at: :desc)
    render json: reports
  end

  def show
    report = Report.find(params[:id])
    render json: report
  end

  def create
    report = Report.new(report_params.merge(created_by_id: @current_user.id))
    if report.save
      render json: report, status: :created
    else
      render json: { errors: report.errors }, status: :unprocessable_entity
    end
  end

  def update
    report = Report.find(params[:id])
    if report.update(report_params)
      render json: report
    else
      render json: { errors: report.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    Report.find(params[:id]).destroy
    head :no_content
  end

  private

  def report_params
    params.require(:report).permit(:name, :report_type, :configuration, :project_id)
  end
end

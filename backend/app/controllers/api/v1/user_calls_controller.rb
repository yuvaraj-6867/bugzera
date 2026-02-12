class Api::V1::UserCallsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user_call, only: [:show, :answer, :end_call]

  def create
    @user_call = UserCall.new(user_call_params)
    @user_call.caller = current_user
    @user_call.status = 'initiated'

    if @user_call.save
      render json: @user_call, status: :created
    else
      render json: { errors: @user_call.errors }, status: :unprocessable_entity
    end
  end

  def answer
    if @user_call.answer!
      render json: @user_call
    else
      render json: { errors: @user_call.errors }, status: :unprocessable_entity
    end
  end

  def end_call
    if @user_call.end_call!
      render json: @user_call
    else
      render json: { errors: @user_call.errors }, status: :unprocessable_entity
    end
  end

  private

  def set_user_call
    @user_call = UserCall.find(params[:id])
  end

  def user_call_params
    params.require(:user_call).permit(:receiver_id, :test_case_id, :call_type)
  end
end
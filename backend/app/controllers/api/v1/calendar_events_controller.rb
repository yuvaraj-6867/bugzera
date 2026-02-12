class Api::V1::CalendarEventsController < ApplicationController
  before_action :set_calendar_event, only: [:show, :update, :destroy]

  def index
    @events = CalendarEvent.includes(:created_by, :eventable)
    @events = @events.for_date_range(params[:start_date], params[:end_date]) if params[:start_date] && params[:end_date]
    @events = @events.by_type(params[:event_type]) if params[:event_type].present?
    
    render json: @events.map { |event| event_json(event) }
  end

  def show
    render json: event_json(@event)
  end

  def create
    @event = CalendarEvent.new(event_params)
    @event.created_by = current_user

    if @event.save
      render json: event_json(@event), status: :created
    else
      render json: { errors: @event.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @event.update(event_params)
      render json: event_json(@event)
    else
      render json: { errors: @event.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @event.destroy
    head :no_content
  end



  private

  def set_calendar_event
    @event = CalendarEvent.find(params[:id])
  end

  def event_params
    params.require(:calendar_event).permit(
      :title, :description, :start_time, :event_type, 
      :status, :all_day, :location, :attendees, :eventable_type, :eventable_id
    )
  end

  def event_json(event)
    {
      id: event.id,
      title: event.title,
      description: event.description,
      start_time: event.start_time,
      event_type: event.event_type,
      status: event.status,
      all_day: event.all_day,
      location: event.location,
      attendees: event.attendees,
      created_by: {
        id: event.created_by.id,
        name: "#{event.created_by.first_name} #{event.created_by.last_name}"
      },
      eventable: event.eventable ? {
        type: event.eventable_type,
        id: event.eventable_id,
        title: event.eventable.try(:title) || event.eventable.try(:name)
      } : nil,
      created_at: event.created_at,
      updated_at: event.updated_at
    }
  end
end
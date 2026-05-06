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
      AuditLog.log(action: 'calendar_event_created', user: current_user, request: request, details: "Created event: #{@event.title}") rescue nil
      # Handle recurring events
      recurrence_rule  = params[:recurrence_rule].to_s.strip  # daily | weekly | monthly
      recurrence_count = [[params[:recurrence_count].to_i, 1].max, 52].min

      if recurrence_rule.in?(%w[daily weekly monthly]) && recurrence_count > 1
        created_events = [@event]
        (recurrence_count - 1).times do |i|
          offset = case recurrence_rule
                   when 'daily'   then (i + 1).days
                   when 'weekly'  then (i + 1).weeks
                   when 'monthly' then (i + 1).months
                   end
          copy = CalendarEvent.new(
            event_params.merge(start_time: @event.start_time + offset)
          )
          copy.created_by = current_user
          created_events << copy if copy.save
        end
        render json: created_events.map { |e| event_json(e) }, status: :created
      else
        render json: event_json(@event), status: :created
      end
    else
      render json: { errors: @event.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @event.update(event_params)
      AuditLog.log(action: 'calendar_event_updated', user: current_user, request: request, details: "Updated event: #{@event.title}") rescue nil
      render json: event_json(@event)
    else
      render json: { errors: @event.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    # Delete from Google Calendar if linked
    if @event.google_event_id.present?
      account = current_user.google_calendar_accounts.first
      if account
        begin
          client = Signet::OAuth2::Client.new(
            client_id:            ENV.fetch('GOOGLE_CLIENT_ID', ''),
            client_secret:        ENV.fetch('GOOGLE_CLIENT_SECRET', ''),
            token_credential_uri: 'https://oauth2.googleapis.com/token',
            access_token:         account.access_token,
            refresh_token:        account.refresh_token,
            expires_at:           account.token_expiry
          )
          client.refresh! if client.expired?
          service = Google::Apis::CalendarV3::CalendarService.new
          service.authorization = client
          service.delete_event('primary', @event.google_event_id)
        rescue => e
          Rails.logger.warn "Google Calendar delete failed: #{e.message}"
        end
      end
    end
    @event.destroy
    AuditLog.log(action: 'calendar_event_deleted', user: current_user, request: request, details: "Deleted event: #{@event.title}") rescue nil
    head :no_content
  end

  def upcoming
    limit  = (params[:limit] || 10).to_i
    events = CalendarEvent.includes(:created_by)
                          .where('start_time >= ?', Time.current)
                          .order(start_time: :asc)
                          .limit(limit)
    render json: events.map { |e| event_json(e) }
  end

  private

  def set_calendar_event
    @event = CalendarEvent.find(params[:id])
  end

  def event_params
    params.require(:calendar_event).permit(
      :title, :description, :start_time, :event_type,
      :status, :all_day, :location, :attendees, :eventable_type, :eventable_id, :google_event_id
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
      created_by: event.created_by ? {
        id: event.created_by.id,
        name: "#{event.created_by.first_name} #{event.created_by.last_name}"
      } : nil,
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
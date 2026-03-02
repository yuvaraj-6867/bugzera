require 'set'
require 'google/apis/calendar_v3'
require 'googleauth'

module Api
  module V1
    class GoogleCalendarController < ApplicationController
      skip_before_action :authenticate_request, only: [:callback]
      skip_before_action :check_authorization,  only: [:callback]

      SCOPE = Google::Apis::CalendarV3::AUTH_CALENDAR

      # GET /api/v1/google_calendar/auth_url
      def auth_url
        client = oauth_client
        url = client.authorization_uri(
          scope: SCOPE,
          access_type: 'offline',
          prompt: 'consent',
          state: current_user.id.to_s
        ).to_s
        render json: { url: url }
      end

      # GET /api/v1/google_calendar/callback  (Google OAuth redirect)
      def callback
        code     = params[:code]
        user_id  = params[:state]

        unless code.present? && user_id.present?
          return render html: close_popup_html('error', 'Missing code or state').html_safe
        end

        user = User.find_by(id: user_id)
        unless user
          return render html: close_popup_html('error', 'User not found').html_safe
        end

        client = oauth_client
        client.code = code
        client.fetch_access_token!

        user.update!(
          google_calendar_access_token:  client.access_token,
          google_calendar_refresh_token: client.refresh_token || user.google_calendar_refresh_token,
          google_calendar_token_expiry:  client.expires_at,
          google_calendar_connected_at:  Time.current,
          google_calendar_email:         fetch_google_email(client)
        )

        render html: close_popup_html('success', user.google_calendar_email).html_safe
      rescue => e
        render html: close_popup_html('error', e.message).html_safe
      end

      # GET /api/v1/google_calendar/status
      def status
        if current_user.google_calendar_connected_at.present?
          render json: {
            connected: true,
            email: current_user.google_calendar_email,
            connected_at: current_user.google_calendar_connected_at
          }
        else
          render json: { connected: false }
        end
      end

      # GET /api/v1/google_calendar/events?start=YYYY-MM-DD&end=YYYY-MM-DD
      def events
        return render json: { error: 'Google Calendar not connected' }, status: :unprocessable_entity unless current_user.google_calendar_connected_at.present?

        service  = calendar_service
        time_min = params[:start].present? ? Time.parse(params[:start]).iso8601 : Time.current.beginning_of_month.iso8601
        time_max = params[:end].present?   ? Time.parse(params[:end]).iso8601   : Time.current.end_of_month.iso8601

        # Fetch from all user calendars EXCEPT holiday calendars
        cal_ids = begin
          cal_list = service.list_calendar_lists(min_access_role: 'reader')
          (cal_list.items || [])
            .reject { |cal| cal.id.to_s.include?('#holiday') }
            .map(&:id)
        rescue
          ['primary']
        end
        cal_ids = ['primary'] if cal_ids.empty?

        data = []
        seen_ids = Set.new

        cal_ids.each do |cal_id|
          begin
            result = service.list_events(
              cal_id,
              single_events: true,
              order_by:      'startTime',
              time_min:      time_min,
              time_max:      time_max,
              max_results:   250
            )
            (result.items || []).each do |ev|
              next if seen_ids.include?(ev.id)
              seen_ids << ev.id
              start_dt = ev.start.date_time || ev.start.date
              end_dt   = ev.end.date_time   || ev.end.date
              data << {
                id:          ev.id,
                title:       ev.summary.presence || '(No title)',
                description: ev.description,
                location:    ev.location,
                start_time:  start_dt.to_s,
                end_time:    end_dt.to_s,
                all_day:     ev.start.date.present?,
                is_google:   true
              }
            end
          rescue
            next
          end
        end

        render json: data
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # POST /api/v1/google_calendar/sync
      def sync
        return render json: { error: 'Google Calendar not connected' }, status: :unprocessable_entity unless current_user.google_calendar_connected_at.present?

        service = calendar_service
        pushed = 0
        errors = []

        CalendarEvent.order(start_time: :asc).each do |ev|
          next unless ev.start_time.present?
          begin
            google_event = Google::Apis::CalendarV3::Event.new(
              summary:     ev.title,
              description: ev.description,
              location:    ev.location,
              start:       Google::Apis::CalendarV3::EventDateTime.new(
                date_time: ev.start_time.iso8601,
                time_zone: 'UTC'
              ),
              end:         Google::Apis::CalendarV3::EventDateTime.new(
                date_time: (ev.start_time + 1.hour).iso8601,
                time_zone: 'UTC'
              )
            )
            service.insert_event('primary', google_event)
            pushed += 1
          rescue => e
            errors << { event: ev.title, error: e.message }
          end
        end

        render json: { synced: pushed, errors: errors }
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # POST /api/v1/google_calendar/push_event
      def push_event
        return render json: { error: 'Google Calendar not connected' }, status: :unprocessable_entity unless current_user.google_calendar_connected_at.present?

        service    = calendar_service
        start_time = params[:start_time].present? ? Time.parse(params[:start_time]) : Time.current
        end_time   = params[:end_time].present?   ? Time.parse(params[:end_time])   : start_time + 1.hour

        google_event = Google::Apis::CalendarV3::Event.new(
          summary:     params[:title].presence || '(No title)',
          description: params[:description],
          location:    params[:location],
          start: Google::Apis::CalendarV3::EventDateTime.new(
            date_time: start_time.iso8601,
            time_zone: 'Asia/Kolkata'
          ),
          end: Google::Apis::CalendarV3::EventDateTime.new(
            date_time: end_time.iso8601,
            time_zone: 'Asia/Kolkata'
          )
        )

        result = service.insert_event('primary', google_event)
        render json: { google_event_id: result.id, success: true }
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # DELETE /api/v1/google_calendar/delete_event?event_id=xxx
      def delete_event
        return render json: { error: 'Google Calendar not connected' }, status: :unprocessable_entity unless current_user.google_calendar_connected_at.present?

        event_id = params[:event_id]
        return render json: { error: 'event_id is required' }, status: :bad_request unless event_id.present?

        service = calendar_service
        service.delete_event('primary', event_id)
        render json: { deleted: true }
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # DELETE /api/v1/google_calendar/disconnect
      def disconnect
        current_user.update!(
          google_calendar_access_token:  nil,
          google_calendar_refresh_token: nil,
          google_calendar_token_expiry:  nil,
          google_calendar_connected_at:  nil,
          google_calendar_email:         nil
        )
        render json: { disconnected: true }
      end

      private

      def oauth_client
        client = Signet::OAuth2::Client.new(
          client_id:            ENV.fetch('GOOGLE_CLIENT_ID', ''),
          client_secret:        ENV.fetch('GOOGLE_CLIENT_SECRET', ''),
          authorization_uri:    'https://accounts.google.com/o/oauth2/auth',
          token_credential_uri: 'https://oauth2.googleapis.com/token',
          redirect_uri:         ENV.fetch('GOOGLE_REDIRECT_URI', "#{request.base_url}/api/v1/google_calendar/callback")
        )
        client
      end

      def calendar_service
        client = oauth_client
        client.access_token  = current_user.google_calendar_access_token
        client.refresh_token = current_user.google_calendar_refresh_token
        client.expires_at    = current_user.google_calendar_token_expiry

        # Refresh token if expired
        client.refresh! if client.expired?

        service = Google::Apis::CalendarV3::CalendarService.new
        service.authorization = client
        service
      end

      def fetch_google_email(client)
        uri = URI("https://www.googleapis.com/oauth2/v2/userinfo?access_token=#{client.access_token}")
        res = Net::HTTP.get_response(uri)
        JSON.parse(res.body)['email']
      rescue
        nil
      end

      def accessible_project_ids
        current_user.admin? ? Project.pluck(:id) : current_user.project_users.pluck(:project_id)
      end

      def close_popup_html(status, message)
        color   = status == 'success' ? '#22c55e' : '#ef4444'
        icon    = status == 'success' ? '✓' : '✗'
        title   = status == 'success' ? 'Connected!' : 'Error'
        <<~HTML
          <!DOCTYPE html>
          <html>
          <head>
            <title>Google Calendar</title>
            <style>
              body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center;
                     height: 100vh; margin: 0; background: #f9fafb; }
              .card { text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,.1); }
              .icon { font-size: 3rem; color: #{color}; }
              h2 { margin: .5rem 0; color: #111; }
              p  { color: #6b7280; font-size: .9rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">#{icon}</div>
              <h2>#{title}</h2>
              <p>#{CGI.escapeHTML(message.to_s)}</p>
              <p style="font-size:.8rem;color:#9ca3af;margin-top:1rem">This window will close automatically…</p>
            </div>
            <script>setTimeout(() => window.close(), 1500);</script>
          </body>
          </html>
        HTML
      end
    end
  end
end

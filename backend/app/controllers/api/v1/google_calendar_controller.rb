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

      # GET /api/v1/google_calendar/callback
      def callback
        code    = params[:code]
        user_id = params[:state]

        unless code.present? && user_id.present?
          return render html: close_popup_html('error', 'Missing code or state').html_safe
        end

        user = User.find_by(id: user_id)
        return render html: close_popup_html('error', 'User not found').html_safe unless user

        client = oauth_client
        client.code = code
        client.fetch_access_token!

        email = fetch_google_email(client)

        account = user.google_calendar_accounts.find_or_initialize_by(email: email)
        account.update!(
          access_token:  client.access_token,
          refresh_token: client.refresh_token || account.refresh_token,
          token_expiry:  client.expires_at,
          connected_at:  Time.current
        )

        render html: close_popup_html('success', email).html_safe
      rescue => e
        render html: close_popup_html('error', e.message).html_safe
      end

      # GET /api/v1/google_calendar/status
      def status
        accounts = current_user.google_calendar_accounts.order(:connected_at)
        render json: {
          connected: accounts.any?,
          accounts: accounts.map { |a| { id: a.id, email: a.email, connected_at: a.connected_at } }
        }
      end

      # GET /api/v1/google_calendar/events
      def events
        accounts = current_user.google_calendar_accounts
        return render json: { error: 'Google Calendar not connected' }, status: :unprocessable_entity if accounts.empty?

        time_min = params[:start].present? ? Time.parse(params[:start]).iso8601 : Time.current.beginning_of_month.iso8601
        time_max = params[:end].present?   ? Time.parse(params[:end]).iso8601   : Time.current.end_of_month.iso8601

        data     = []
        seen_ids = Set.new

        accounts.each do |account|
          service = calendar_service_for(account)
          cal_ids = begin
            cal_list = service.list_calendar_lists(min_access_role: 'reader')
            (cal_list.items || []).reject { |c| c.id.to_s.include?('#holiday') }.map(&:id)
          rescue
            ['primary']
          end
          cal_ids = ['primary'] if cal_ids.empty?

          cal_ids.each do |cal_id|
            begin
              result = service.list_events(cal_id, single_events: true, order_by: 'startTime',
                                           time_min: time_min, time_max: time_max, max_results: 250)
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
                  is_google:   true,
                  account_email: account.email
                }
              end
            rescue
              next
            end
          end
        end

        render json: data
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # POST /api/v1/google_calendar/sync
      def sync
        account = find_account!
        return unless account

        service = calendar_service_for(account)
        pushed  = 0
        errors  = []

        CalendarEvent.order(start_time: :asc).each do |ev|
          next unless ev.start_time.present?
          begin
            google_event = Google::Apis::CalendarV3::Event.new(
              summary:     ev.title,
              description: ev.description,
              location:    ev.location,
              start: Google::Apis::CalendarV3::EventDateTime.new(date_time: ev.start_time.iso8601, time_zone: 'UTC'),
              end:   Google::Apis::CalendarV3::EventDateTime.new(date_time: (ev.start_time + 1.hour).iso8601, time_zone: 'UTC')
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
        account = find_account!
        return unless account

        service    = calendar_service_for(account)
        start_time = params[:start_time].present? ? Time.parse(params[:start_time]) : Time.current
        end_time   = params[:end_time].present?   ? Time.parse(params[:end_time])   : start_time + 1.hour

        google_event = Google::Apis::CalendarV3::Event.new(
          summary:     params[:title].presence || '(No title)',
          description: params[:description],
          location:    params[:location],
          start: Google::Apis::CalendarV3::EventDateTime.new(date_time: start_time.iso8601, time_zone: 'Asia/Kolkata'),
          end:   Google::Apis::CalendarV3::EventDateTime.new(date_time: end_time.iso8601,   time_zone: 'Asia/Kolkata')
        )

        result = service.insert_event('primary', google_event)
        render json: { google_event_id: result.id, success: true }
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # DELETE /api/v1/google_calendar/delete_event?event_id=xxx
      def delete_event
        account = find_account!
        return unless account

        event_id = params[:event_id]
        return render json: { error: 'event_id is required' }, status: :bad_request unless event_id.present?

        calendar_service_for(account).delete_event('primary', event_id)
        render json: { deleted: true }
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # DELETE /api/v1/google_calendar/disconnect?account_id=xxx  (or all if no id)
      def disconnect
        if params[:account_id].present?
          current_user.google_calendar_accounts.find(params[:account_id]).destroy
        else
          current_user.google_calendar_accounts.destroy_all
        end
        render json: { disconnected: true }
      end

      private

      def find_account!
        account_id = params[:account_id]
        account = account_id.present? ?
          current_user.google_calendar_accounts.find_by(id: account_id) :
          current_user.google_calendar_accounts.first

        unless account
          render json: { error: 'Google Calendar not connected' }, status: :unprocessable_entity
        end
        account
      end

      def oauth_client
        Signet::OAuth2::Client.new(
          client_id:            ENV.fetch('GOOGLE_CLIENT_ID', ''),
          client_secret:        ENV.fetch('GOOGLE_CLIENT_SECRET', ''),
          authorization_uri:    'https://accounts.google.com/o/oauth2/auth',
          token_credential_uri: 'https://oauth2.googleapis.com/token',
          redirect_uri:         ENV.fetch('GOOGLE_REDIRECT_URI', "#{request.base_url}/api/v1/google_calendar/callback")
        )
      end

      def calendar_service_for(account)
        client = oauth_client
        client.access_token  = account.access_token
        client.refresh_token = account.refresh_token
        client.expires_at    = account.token_expiry
        client.refresh! if client.expired?

        # Persist refreshed token
        if client.access_token != account.access_token
          account.update_columns(access_token: client.access_token, token_expiry: client.expires_at)
        end

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

      def close_popup_html(status, message)
        color = status == 'success' ? '#22c55e' : '#ef4444'
        icon  = status == 'success' ? '✓' : '✗'
        title = status == 'success' ? 'Connected!' : 'Error'
        <<~HTML
          <!DOCTYPE html><html><head><title>Google Calendar</title>
          <style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb}
          .card{text-align:center;padding:2rem;background:white;border-radius:1rem;box-shadow:0 4px 20px rgba(0,0,0,.1)}
          .icon{font-size:3rem;color:#{color}}h2{margin:.5rem 0;color:#111}p{color:#6b7280;font-size:.9rem}</style></head>
          <body><div class="card"><div class="icon">#{icon}</div><h2>#{title}</h2>
          <p>#{CGI.escapeHTML(message.to_s)}</p>
          <p style="font-size:.8rem;color:#9ca3af;margin-top:1rem">This window will close automatically…</p></div>
          <script>setTimeout(()=>window.close(),1500)</script></body></html>
        HTML
      end
    end
  end
end

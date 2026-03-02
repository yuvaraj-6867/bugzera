# Google Calendar OAuth2 Configuration
# Set these in your .env file or environment:
#
#   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
#   GOOGLE_CLIENT_SECRET=your-client-secret
#   GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/google_calendar/callback
#
# Steps to get credentials:
# 1. Go to https://console.cloud.google.com
# 2. Create a new project (or select existing)
# 3. Enable "Google Calendar API"
# 4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
# 5. Application type: Web application
# 6. Authorized redirect URIs: http://localhost:3000/api/v1/google_calendar/callback
# 7. Copy Client ID and Client Secret to .env

Rails.application.config.google_calendar = {
  client_id:     ENV.fetch('GOOGLE_CLIENT_ID', ''),
  client_secret: ENV.fetch('GOOGLE_CLIENT_SECRET', ''),
  redirect_uri:  ENV.fetch('GOOGLE_REDIRECT_URI', 'http://localhost:3000/api/v1/google_calendar/callback')
}

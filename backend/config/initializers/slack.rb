Rails.application.configure do
  begin
    config.slack = config_for(:slack_config)
  rescue RuntimeError
    # Fallback if config file doesn't exist
    config.slack = {
      'slack_webhook_url' => ENV['SLACK_WEBHOOK_URL']
    }
  end
end
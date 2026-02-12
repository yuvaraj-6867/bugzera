class Api::SlackController < ApplicationController
  skip_before_action :authenticate_request, only: [:configure]
  skip_before_action :check_authorization, only: [:configure]
  skip_before_action :update_user_activity, only: [:configure]
  
  def configure
    webhook_url = params[:webhook_url]
    
    if webhook_url.present?
      # Update config file
      config_path = Rails.root.join('config', 'slack_config.yml')
      config = YAML.load_file(config_path)
      config['development']['slack_webhook_url'] = webhook_url
      config['production']['slack_webhook_url'] = webhook_url
      
      File.write(config_path, config.to_yaml)
      
      render json: { status: 'success', message: 'Slack webhook configured' }
    else
      render json: { status: 'error', message: 'Webhook URL required' }, status: 400
    end
  end
  

end
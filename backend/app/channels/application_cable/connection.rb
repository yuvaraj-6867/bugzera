module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      token = request.params[:token]
      
      if token.blank?
        logger.error "WebSocket connection rejected: No token provided"
        reject_unauthorized_connection
      end
      
      begin
        decoded_token = JsonWebToken.decode(token)
        user = User.find(decoded_token[:user_id])
        logger.info "WebSocket connection established for user: #{user.email}"
        user
      rescue JWT::DecodeError => e
        logger.error "WebSocket connection rejected: Invalid token - #{e.message}"
        reject_unauthorized_connection
      rescue ActiveRecord::RecordNotFound => e
        logger.error "WebSocket connection rejected: User not found - #{e.message}"
        reject_unauthorized_connection
      rescue => e
        logger.error "WebSocket connection rejected: Unexpected error - #{e.message}"
        reject_unauthorized_connection
      end
    end
  end
end
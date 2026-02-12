class HomeController < ApplicationController
  skip_before_action :authenticate_request

  def index
    render json: {
      message: "BugZera API",
      version: "1.0.0",
      endpoints: {
        authentication: "/api/v1/auth/login",
        test_cases: "/api/v1/test_cases",
        tickets: "/api/v1/tickets",
        dashboard: "/api/v1/dashboard/metrics",
        users: "/api/v1/users"
      },
      status: "running"
    }
  end
end
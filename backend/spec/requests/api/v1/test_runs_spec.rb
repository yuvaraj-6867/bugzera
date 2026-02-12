require 'rails_helper'

RSpec.describe "Api::V1::TestRuns", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/api/v1/test_runs/index"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /show" do
    it "returns http success" do
      get "/api/v1/test_runs/show"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /create" do
    it "returns http success" do
      get "/api/v1/test_runs/create"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /update" do
    it "returns http success" do
      get "/api/v1/test_runs/update"
      expect(response).to have_http_status(:success)
    end
  end

end

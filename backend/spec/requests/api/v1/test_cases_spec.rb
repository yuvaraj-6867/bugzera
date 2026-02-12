require 'rails_helper'

RSpec.describe "Api::V1::TestCases", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/api/v1/test_cases/index"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /show" do
    it "returns http success" do
      get "/api/v1/test_cases/show"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /create" do
    it "returns http success" do
      get "/api/v1/test_cases/create"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /update" do
    it "returns http success" do
      get "/api/v1/test_cases/update"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /destroy" do
    it "returns http success" do
      get "/api/v1/test_cases/destroy"
      expect(response).to have_http_status(:success)
    end
  end

end

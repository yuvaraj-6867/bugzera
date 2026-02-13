FactoryBot.define do
  factory :integration do
    name { "MyString" }
    description { "MyText" }
    integration_type { "MyString" }
    status { "MyString" }
    project_id { 1 }
    auth_type { "MyString" }
    api_key { "MyText" }
    username { "MyString" }
    password_digest { "MyString" }
    base_url { "MyString" }
    webhook_url { "MyString" }
    secret_token { "MyString" }
    auto_sync { false }
    sync_interval { 1 }
  end
end

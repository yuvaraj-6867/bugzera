FactoryBot.define do
  factory :environment do
    name { "MyString" }
    description { "MyText" }
    environment_type { "MyString" }
    status { "MyString" }
    base_url { "MyString" }
    health_check_url { "MyString" }
    project_id { 1 }
    database_connection { "MyText" }
    environment_variables { "MyText" }
    api_key { "MyString" }
    secret_key { "MyString" }
    target_devices { "MyText" }
  end
end

FactoryBot.define do
  factory :test_plan do
    name { "MyString" }
    description { "MyText" }
    status { "MyString" }
    start_date { "2026-02-13" }
    end_date { "2026-02-13" }
    created_by { 1 }
    project_id { 1 }
  end
end

FactoryBot.define do
  factory :test_case do
    title { "MyString" }
    description { "MyText" }
    preconditions { "MyText" }
    steps { "" }
    expected_results { "MyText" }
    priority { 1 }
    status { "MyString" }
    assigned_user { nil }
    folder { nil }
    created_by { nil }
  end
end

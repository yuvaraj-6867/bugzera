FactoryBot.define do
  factory :test_run do
    test_case { nil }
    user { nil }
    status { "MyString" }
    execution_time { 1 }
    notes { "MyText" }
    evidence { "" }
  end
end

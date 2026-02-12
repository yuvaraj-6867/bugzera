FactoryBot.define do
  factory :automation_script do
    name { "MyString" }
    description { "MyText" }
    script_path { "MyString" }
    test_case { nil }
    user { nil }
    status { "MyString" }
  end
end

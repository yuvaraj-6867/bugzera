FactoryBot.define do
  factory :ticket do
    title { "MyString" }
    description { "MyText" }
    status { "MyString" }
    priority { "MyString" }
    severity { "MyString" }
    assigned_user { nil }
    created_by { nil }
  end
end

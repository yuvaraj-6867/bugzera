FactoryBot.define do
  factory :document do
    title { "MyString" }
    description { "MyText" }
    file_path { "MyString" }
    file_size { 1 }
    content_type { "MyString" }
    version { "MyString" }
    folder { nil }
    user { nil }
    tags { "MyText" }
  end
end

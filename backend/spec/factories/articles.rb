FactoryBot.define do
  factory :article do
    title { "MyString" }
    category { "MyString" }
    status { "MyString" }
    content { "MyText" }
    tags { "MyString" }
    visibility { false }
    summary { "MyText" }
    related_articles { "MyString" }
    author_id { 1 }
    display_order { 1 }
    user_id { 1 }
  end
end

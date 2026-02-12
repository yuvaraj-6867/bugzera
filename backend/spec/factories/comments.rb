FactoryBot.define do
  factory :comment do
    content { "MyText" }
    commentable { nil }
    user { nil }
  end
end

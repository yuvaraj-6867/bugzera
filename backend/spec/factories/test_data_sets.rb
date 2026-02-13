FactoryBot.define do
  factory :test_data_set do
    name { "MyString" }
    description { "MyText" }
    project_id { 1 }
    environment_id { 1 }
    data_type { "MyString" }
    version { "MyString" }
    data_content { "MyText" }
    generation_method { "MyString" }
    template_id { 1 }
    records_count { 1 }
    is_active { false }
    mask_sensitive { false }
    tags { "MyString" }
  end
end

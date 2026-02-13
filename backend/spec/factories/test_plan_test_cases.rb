FactoryBot.define do
  factory :test_plan_test_case do
    test_plan { nil }
    test_case { nil }
    execution_order { 1 }
  end
end

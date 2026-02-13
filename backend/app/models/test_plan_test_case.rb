class TestPlanTestCase < ApplicationRecord
  belongs_to :test_plan
  belongs_to :test_case

  validates :test_plan_id, uniqueness: { scope: :test_case_id, message: "Test case already added to this test plan" }
  validates :execution_order, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

  default_scope { order(execution_order: :asc) }
end

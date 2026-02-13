class AddTestPlanNumberToTestPlans < ActiveRecord::Migration[7.1]
  def change
    add_column :test_plans, :test_plan_number, :string
  end
end

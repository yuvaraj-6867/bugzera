class CreateTestPlanTestCases < ActiveRecord::Migration[7.1]
  def change
    create_table :test_plan_test_cases do |t|
      t.references :test_plan, null: false, foreign_key: true
      t.references :test_case, null: false, foreign_key: true
      t.integer :execution_order

      t.timestamps
    end
  end
end

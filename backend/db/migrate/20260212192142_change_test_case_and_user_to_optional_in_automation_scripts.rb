class ChangeTestCaseAndUserToOptionalInAutomationScripts < ActiveRecord::Migration[7.1]
  def change
    # Remove foreign key constraints
    remove_foreign_key :automation_scripts, :test_cases if foreign_key_exists?(:automation_scripts, :test_cases)
    remove_foreign_key :automation_scripts, :users if foreign_key_exists?(:automation_scripts, :users)

    # Change columns to allow NULL
    change_column_null :automation_scripts, :test_case_id, true
    change_column_null :automation_scripts, :user_id, true

    # Re-add foreign key constraints without NOT NULL requirement
    add_foreign_key :automation_scripts, :test_cases unless foreign_key_exists?(:automation_scripts, :test_cases)
    add_foreign_key :automation_scripts, :users unless foreign_key_exists?(:automation_scripts, :users)
  end
end

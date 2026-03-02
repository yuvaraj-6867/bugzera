class AddScriptFieldsToAutomationScripts < ActiveRecord::Migration[7.1]
  def change
    add_column :automation_scripts, :script_type, :string, default: 'functional'
    add_column :automation_scripts, :language, :string, default: 'javascript'
    add_column :automation_scripts, :script_content, :text
    add_column :automation_scripts, :framework, :string, default: 'playwright'
  end
end

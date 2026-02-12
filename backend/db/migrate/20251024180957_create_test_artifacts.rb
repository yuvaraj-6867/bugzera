class CreateTestArtifacts < ActiveRecord::Migration[7.1]
  def change
    create_table :test_artifacts do |t|
      t.references :test_run, null: false, foreign_key: true
      t.string :artifact_type
      t.string :name
      t.string :file_path
      t.string :test_case
      t.string :status
      t.datetime :timestamp

      t.timestamps
    end
  end
end

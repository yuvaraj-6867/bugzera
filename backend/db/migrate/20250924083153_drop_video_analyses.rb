class DropVideoAnalyses < ActiveRecord::Migration[7.1]
  def change
    drop_table :video_analyses, if_exists: true
  end
end

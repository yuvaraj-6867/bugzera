class CreateArticleFeedback < ActiveRecord::Migration[7.1]
  def change
    create_table :article_feedback do |t|
      t.integer :article_id, null: false
      t.integer :user_id,    null: false
      t.boolean :helpful,    null: false     # true = helpful, false = not helpful
      t.text    :comment

      t.timestamps
    end
    add_index :article_feedback, :article_id
    add_index :article_feedback, [:article_id, :user_id], unique: true
  end
end

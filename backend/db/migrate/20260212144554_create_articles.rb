class CreateArticles < ActiveRecord::Migration[7.1]
  def change
    create_table :articles do |t|
      t.string :title
      t.string :category
      t.string :status
      t.text :content
      t.string :tags
      t.boolean :visibility
      t.text :summary
      t.string :related_articles
      t.integer :author_id
      t.integer :display_order
      t.integer :user_id

      t.timestamps
    end
  end
end

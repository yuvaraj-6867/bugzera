class CreateKnowledgeBaseCategories < ActiveRecord::Migration[7.1]
  def change
    create_table :knowledge_base_categories do |t|
      t.string  :name,          null: false
      t.text    :description
      t.integer :parent_id                    # self-referential for sub-categories
      t.string  :icon
      t.integer :display_order, default: 0
      t.integer :article_count, default: 0

      t.timestamps
    end
    add_index :knowledge_base_categories, :parent_id
    add_index :knowledge_base_categories, :display_order
  end
end

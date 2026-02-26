class KnowledgeBaseCategory < ApplicationRecord
  belongs_to :parent, class_name: 'KnowledgeBaseCategory', foreign_key: :parent_id, optional: true
  has_many :subcategories, class_name: 'KnowledgeBaseCategory', foreign_key: :parent_id, dependent: :destroy

  validates :name, presence: true

  scope :top_level, -> { where(parent_id: nil) }
  scope :ordered, -> { order(display_order: :asc, name: :asc) }
end

class AutomationTemplate < ApplicationRecord
  belongs_to :user, optional: true

  validates :name, presence: true

  scope :public_templates, -> { where(is_public: true) }
  scope :by_category, ->(cat) { where(category: cat) }
end

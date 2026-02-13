class Article < ApplicationRecord
  validates :title, presence: true
  validates :status, inclusion: { in: %w[draft published archived], allow_blank: true }

  belongs_to :user, optional: true
  belongs_to :author, class_name: 'User', foreign_key: 'author_id', optional: true
end

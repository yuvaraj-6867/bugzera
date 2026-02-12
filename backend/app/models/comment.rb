class Comment < ApplicationRecord
  validates :content, presence: true, length: { minimum: 1, maximum: 2000 }

  belongs_to :commentable, polymorphic: true
  belongs_to :user

  scope :recent, -> { order(created_at: :desc) }
  scope :for_commentable, ->(commentable) { where(commentable: commentable) }

  def author_name
    user.full_name
  end
end
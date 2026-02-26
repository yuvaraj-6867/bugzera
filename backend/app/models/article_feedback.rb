class ArticleFeedback < ApplicationRecord
  self.table_name = 'article_feedback'

  belongs_to :article
  belongs_to :user

  validates :user_id, uniqueness: { scope: :article_id, message: 'already submitted feedback for this article' }
end

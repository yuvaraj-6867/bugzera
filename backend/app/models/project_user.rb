class ProjectUser < ApplicationRecord
  belongs_to :project
  belongs_to :user
  
  validates :role, inclusion: { in: %w[admin manager member developer viewer] }
  validates :project_id, uniqueness: { scope: :user_id }
end
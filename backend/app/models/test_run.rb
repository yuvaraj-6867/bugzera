class TestRun < ApplicationRecord
  belongs_to :test_case, optional: true
  belongs_to :user, optional: true
  belongs_to :project, optional: true
  
  validates :status, inclusion: { in: %w[pending running passed failed] }
  
  def repository_url
    project&.repository_url || "https://github.com/example/test-repo"
  end
  
  def branch
    project&.default_branch || "main"
  end
  
  def current_step
    read_attribute(:current_step) || case status
    when 'running' then 'git_clone'
    when 'passed', 'failed' then 'completed'
    else 'pending'
    end
  end
end
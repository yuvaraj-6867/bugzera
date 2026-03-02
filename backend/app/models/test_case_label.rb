class TestCaseLabel < ApplicationRecord
  belongs_to :test_case
  belongs_to :label
end

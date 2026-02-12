class Folder < ApplicationRecord
  validates :name, presence: true, length: { maximum: 255 }

  belongs_to :parent, class_name: 'Folder', optional: true
  has_many :children, class_name: 'Folder', foreign_key: 'parent_id', dependent: :destroy
  has_many :test_cases, dependent: :nullify

  scope :root_folders, -> { where(parent_id: nil) }

  def full_path
    return name if parent.nil?
    "#{parent.full_path}/#{name}"
  end

  def descendant_test_cases
    TestCase.joins(:folder).where(folders: { id: descendant_ids + [id] })
  end

  private

  def descendant_ids
    children.flat_map { |child| [child.id] + child.send(:descendant_ids) }
  end
end
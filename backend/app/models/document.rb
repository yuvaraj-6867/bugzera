class Document < ApplicationRecord
  validates :title, presence: true, length: { maximum: 255 }
  validates :file_path, presence: true
  validates :content_type, presence: true
  validates :version, presence: true

  belongs_to :folder, optional: true
  belongs_to :user
  belongs_to :project, optional: true
  has_many :document_versions, dependent: :destroy
  has_many :document_approvals, dependent: :destroy

  scope :by_folder, ->(folder_id) { where(folder_id: folder_id) }
  scope :by_tags, ->(tag_list) { where("tags LIKE ?", "%#{tag_list.join('%')}%") }
  scope :recent, -> { order(created_at: :desc) }

  def tag_list
    tags&.split(',')&.map(&:strip) || []
  end

  def tag_list=(new_tags)
    self.tags = Array(new_tags).join(', ')
  end

  def file_size_human
    return 'N/A' unless file_size

    units = %w[B KB MB GB TB]
    size = file_size.to_f
    unit_index = 0

    while size >= 1024 && unit_index < units.length - 1
      size /= 1024
      unit_index += 1
    end

    "#{size.round(2)} #{units[unit_index]}"
  end

  def file_exists?
    File.exist?(Rails.root.join('public', file_path))
  end
end
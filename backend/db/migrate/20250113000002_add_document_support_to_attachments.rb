class AddDocumentSupportToAttachments < ActiveRecord::Migration[7.0]
  def up
    # Update existing attachments that might be documents
    TestCaseAttachment.find_each do |attachment|
      if attachment.content_type&.match?(/excel|spreadsheet|csv|pdf|word|document/)
        attachment.update_column(:attachment_type, 'document')
      end
    end
  end

  def down
    # Revert document attachments back to video
    TestCaseAttachment.where(attachment_type: 'document').update_all(attachment_type: 'video')
  end
end
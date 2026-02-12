class AddAttachmentsToTickets < ActiveRecord::Migration[7.1]
  def change
    add_column :tickets, :attachments, :text
  end
end

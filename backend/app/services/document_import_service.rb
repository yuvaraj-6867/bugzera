require 'roo'

class DocumentImportService
  def initialize(file = nil)
    @file = file
  end

  def get_file_headers
    spreadsheet = open_spreadsheet
    headers = spreadsheet.row(1).map(&:to_s).map(&:strip)
    
    item_type = detect_item_type(headers)
    
    {
      file_headers: headers,
      detected_type: item_type,
      row_count: spreadsheet.last_row - 1
    }
  end

  def parse
    spreadsheet = open_spreadsheet
    headers = spreadsheet.row(1).map(&:to_s).map(&:strip)
    
    item_type = detect_item_type(headers)
    
    data = []
    (2..spreadsheet.last_row).each do |i|
      row = spreadsheet.row(i)
      row_data = {}
      headers.each_with_index do |header, index|
        row_data[header] = row[index]&.to_s&.strip
      end
      data << row_data unless row_data.values.all?(&:blank?)
    end

    {
      item_type: item_type,
      headers: headers,
      data: data,
      count: data.length
    }
  end

  def create_items(items, item_type, current_user)
    created_items = []
    errors = []

    items.each_with_index do |item_data, index|
      begin
        if item_type == 'tickets'
          item = create_ticket(item_data, current_user)
        else
          item = create_test_case(item_data, current_user)
        end
        created_items << item
      rescue => e
        errors << { row: index + 1, error: e.message }
      end
    end

    {
      success: true,
      created_count: created_items.length,
      errors: errors,
      items: created_items
    }
  end

  private

  def open_spreadsheet
    case File.extname(@file.original_filename)
    when '.csv'
      Roo::CSV.new(@file.path)
    when '.xls'
      Roo::Excel.new(@file.path)
    when '.xlsx'
      Roo::Excelx.new(@file.path)
    else
      raise "Unknown file type: #{@file.original_filename}"
    end
  end

  def detect_item_type(headers)
    ticket_headers = ['title', 'description', 'status', 'severity']
    test_case_headers = ['title', 'description', 'test steps', 'expected result', 'status']
    
    ticket_match = (headers.map(&:downcase) & ticket_headers).length
    test_case_match = (headers.map(&:downcase) & test_case_headers).length
    
    ticket_match >= test_case_match ? 'tickets' : 'test_cases'
  end

  def create_ticket(data, current_user)
    Ticket.create!(
      title: data['Title'] || data['title'],
      description: data['Description'] || data['description'],
      status: map_status(data['Status'] || data['status'], 'ticket'),
      severity: data['Severity'] || data['severity'] || 'medium',
      created_by: current_user,
      assigned_user_id: data['Assignee'] || data['assignee']
    )
  end

  def create_test_case(data, current_user)
    TestCase.create!(
      title: data['Title'] || data['title'],
      description: data['Description'] || data['description'],
      steps: data['Test Steps'] || data['test steps'],
      expected_results: data['Expected Result'] || data['expected result'],
      status: map_status(data['Status'] || data['status'], 'test_case'),
      created_by: current_user,
      assigned_user_id: data['Assignee'] || data['assignee']
    )
  end

  def map_status(status, type)
    return 'draft' if status.blank?
    
    status = status.downcase.strip
    
    if type == 'ticket'
      case status
      when 'open', 'new' then 'open'
      when 'in progress', 'in_progress' then 'in_progress'
      when 'resolved', 'done' then 'resolved'
      when 'closed' then 'closed'
      else 'open'
      end
    else
      case status
      when 'draft' then 'draft'
      when 'active', 'ready' then 'active'
      when 'in progress', 'in_progress' then 'in_progress'
      when 'passed', 'pass' then 'passed'
      when 'failed', 'fail' then 'failed'
      else 'draft'
      end
    end
  end
end
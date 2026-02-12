class Api::V1::DocumentImportsController < ApplicationController
  skip_before_action :authenticate_request
  skip_before_action :check_authorization
  def preview
    file = params[:file]
    return render json: { error: 'No file provided' }, status: :bad_request unless file

    render json: { success: true }
  end

  def create_items
    items = params[:items]
    item_type = params[:item_type]
    project_id = params[:project]
    assigned_user_id = params[:assigned_user]
    created_by_id = params[:created_by_id]

    return render json: { error: 'No items provided' }, status: :bad_request unless items
    return render json: { error: 'Invalid item type' }, status: :bad_request unless %w[tickets test_cases].include?(item_type)

    created_count = 0
    errors = []

    items.each_with_index do |item, index|
      begin
        if item_type == 'test_cases'
          TestCase.create!(
            title: item['title'] || item['Title'] || 'Untitled Test Case',
            description: item['description'] || item['Description'] || 'No description',
            steps: item['steps'] || item['Steps'] || item['Test Steps'] || 'No steps defined',
            expected_results: item['expected_result'] || item['Expected Result'] || item['expected_results'] || 'No expected result',
            status: item['status'] || item['Status'] || 'draft',
            project_id: project_id,
            assigned_user_id: assigned_user_id.presence,
            created_by_id: created_by_id
          )
        elsif item_type == 'tickets'
          Ticket.create!(
            title: item['title'] || item['Title'] || 'Untitled Ticket',
            description: item['description'] || item['Description'] || 'No description',
            status: item['status'] || item['Status'] || 'open',
            severity: item['severity'] || item['Severity'] || 'minor',
            project_id: project_id,
            assigned_user_id: assigned_user_id.presence,
            created_by_id: created_by_id
          )
        end
        created_count += 1
      rescue => e
        errors << { row: index + 1, error: e.message }
      end
    end

    render json: { created_count: created_count, errors: errors, message: 'Items created successfully' }
  end
end
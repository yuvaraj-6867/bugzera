class Api::V1::AuditLogsController < ApplicationController
  def index
    unless %w[admin manager].include?(@current_user.role)
      return render json: { error: 'Access denied' }, status: :forbidden
    end

    logs = AuditLog.includes(:user).recent

    logs = logs.where(user_id: params[:user_id]) if params[:user_id].present?
    logs = logs.where(action: params[:action]) if params[:action].present?
    logs = logs.where(resource_type: params[:resource_type]) if params[:resource_type].present?

    if params[:from].present?
      logs = logs.where('audit_logs.created_at >= ?', Time.parse(params[:from]))
    end
    if params[:to].present?
      logs = logs.where('audit_logs.created_at <= ?', Time.parse(params[:to]))
    end

    page     = [params.fetch(:page, 1).to_i, 1].max
    per_page = [[params.fetch(:per_page, 50).to_i, 1].max, 100].min
    total    = logs.count

    logs = logs.offset((page - 1) * per_page).limit(per_page)

    render json: {
      audit_logs: logs.as_json.map { |l| l.merge('user_name' => AuditLog.find(l['id']).user_name) },
      meta: { total: total, page: page, per_page: per_page, pages: (total.to_f / per_page).ceil }
    }
  end
end

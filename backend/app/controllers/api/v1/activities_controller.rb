class Api::V1::ActivitiesController < ApplicationController
  def index
    activities = Activity.includes(:owner, :trackable).recent

    activities = activities.where(project_id: params[:project_id]) if params[:project_id].present?
    activities = activities.where(owner_id: params[:user_id]) if params[:user_id].present?
    activities = activities.where('activities.action LIKE ?', "%#{params[:action_type]}%") if params[:action_type].present?
    activities = activities.where('activities.created_at >= ?', Time.parse(params[:from])) if params[:from].present?

    page     = [params.fetch(:page, 1).to_i, 1].max
    per_page = [[params.fetch(:per_page, 30).to_i, 1].max, 100].min
    total    = activities.count
    activities = activities.offset((page - 1) * per_page).limit(per_page)

    render json: {
      activities: activities.as_json,
      meta: { total: total, page: page, per_page: per_page, pages: (total.to_f / per_page).ceil }
    }
  end

  def mentions
    mentions = Mention.where(user_id: @current_user.id)
                      .order(created_at: :desc)
                      .limit(50)
    render json: mentions
  end

  def mark_read
    Mention.where(user_id: @current_user.id, read: false).update_all(read: true)
    render json: { message: 'All mentions marked as read' }
  end

  def export
    activities = Activity.includes(:owner).recent.limit(1000)
    csv = "Date,User,Action,Entity\n"
    activities.each do |a|
      csv += "#{a.created_at},#{a.owner&.full_name},#{a.action},#{a.trackable_type} ##{a.trackable_id}\n"
    end
    send_data csv, filename: "activity_export_#{Date.today}.csv", type: 'text/csv'
  end
end

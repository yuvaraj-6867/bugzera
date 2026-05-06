class Api::V1::ActivitiesController < ApplicationController
  def index
    activities = Activity.includes(:owner, :trackable).recent

    activities = activities.where(project_id: params[:project_id]) if params[:project_id].present?
    activities = activities.where(owner_id: params[:user_id]) if params[:user_id].present?
    activities = activities.where(trackable_type: params[:trackable_type]) if params[:trackable_type].present?
    activities = activities.where('activities.created_at >= ?', Time.parse(params[:from])) if params[:from].present?

    page     = [params.fetch(:page, 1).to_i, 1].max
    per_page = [[params.fetch(:per_page, 30).to_i, 1].max, 100].min
    total    = activities.count

    # When the activities table is empty, synthesize from existing records
    if total == 0 && page == 1 && params[:project_id].blank? && params[:user_id].blank?
      return render json: synthesized_activities(params[:trackable_type])
    end

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

  private

  def synthesized_activities(trackable_type_filter = nil)
    all = []

    unless trackable_type_filter.present? && trackable_type_filter != 'Ticket'
      Ticket.includes(:created_by).order(created_at: :desc).limit(30).each do |t|
        owner = t.created_by
        all << {
          id: "ticket-#{t.id}",
          trackable_type: 'Ticket',
          trackable_id: t.id,
          action: 'created',
          owner_name: owner ? "#{owner.first_name} #{owner.last_name}".strip : 'Unknown',
          owner_initials: owner ? "#{owner.first_name.to_s[0]}#{owner.last_name.to_s[0]}".upcase : '?',
          trackable_name: t.title,
          created_at: t.created_at,
          parsed_parameters: {}
        }
      end
    end

    unless trackable_type_filter.present? && trackable_type_filter != 'TestCase'
      TestCase.includes(:created_by).order(created_at: :desc).limit(20).each do |tc|
        owner = tc.created_by
        all << {
          id: "tc-#{tc.id}",
          trackable_type: 'TestCase',
          trackable_id: tc.id,
          action: 'created',
          owner_name: owner ? "#{owner.first_name} #{owner.last_name}".strip : 'Unknown',
          owner_initials: owner ? "#{owner.first_name.to_s[0]}#{owner.last_name.to_s[0]}".upcase : '?',
          trackable_name: tc.title,
          created_at: tc.created_at,
          parsed_parameters: {}
        }
      end
    end

    unless trackable_type_filter.present? && trackable_type_filter != 'TestRun'
      TestRun.includes(:user).order(created_at: :desc).limit(10).each do |tr|
        owner = tr.user
        all << {
          id: "tr-#{tr.id}",
          trackable_type: 'TestRun',
          trackable_id: tr.id,
          action: 'started',
          owner_name: owner ? "#{owner.first_name} #{owner.last_name}".strip : 'Unknown',
          owner_initials: owner ? "#{owner.first_name.to_s[0]}#{owner.last_name.to_s[0]}".upcase : '?',
          trackable_name: "Test Run ##{tr.id}",
          created_at: tr.created_at,
          parsed_parameters: {}
        }
      end
    end

    unless trackable_type_filter.present? && trackable_type_filter != 'Project'
      Project.order(created_at: :desc).limit(20).each do |p|
        all << {
          id: "project-#{p.id}",
          trackable_type: 'Project',
          trackable_id: p.id,
          action: 'created',
          owner_name: 'Unknown',
          owner_initials: '?',
          trackable_name: p.name,
          created_at: p.created_at,
          parsed_parameters: {}
        }
      end
    end

    all.sort_by! { |a| a[:created_at] }.reverse!

    { activities: all, meta: { total: all.length, page: 1, per_page: all.length, pages: 1 } }
  end
end

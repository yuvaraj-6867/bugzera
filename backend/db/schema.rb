# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_02_28_000024) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "activities", force: :cascade do |t|
    t.string "action", null: false
    t.string "trackable_type"
    t.integer "trackable_id"
    t.integer "owner_id", null: false
    t.string "key"
    t.text "parameters"
    t.string "project_context"
    t.integer "project_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_activities_on_created_at"
    t.index ["owner_id"], name: "index_activities_on_owner_id"
    t.index ["project_id"], name: "index_activities_on_project_id"
    t.index ["trackable_type", "trackable_id"], name: "index_activities_on_trackable_type_and_trackable_id"
  end

  create_table "article_feedback", force: :cascade do |t|
    t.integer "article_id", null: false
    t.integer "user_id", null: false
    t.boolean "helpful", null: false
    t.text "comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["article_id", "user_id"], name: "index_article_feedback_on_article_id_and_user_id", unique: true
    t.index ["article_id"], name: "index_article_feedback_on_article_id"
  end

  create_table "articles", force: :cascade do |t|
    t.string "title"
    t.string "category"
    t.string "status"
    t.text "content"
    t.string "tags"
    t.boolean "visibility"
    t.text "summary"
    t.string "related_articles"
    t.integer "author_id"
    t.integer "display_order"
    t.integer "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "audit_logs", force: :cascade do |t|
    t.integer "user_id"
    t.string "action", null: false
    t.string "resource_type"
    t.integer "resource_id"
    t.text "changes_made"
    t.string "ip_address"
    t.string "user_agent"
    t.string "status", default: "success"
    t.text "details"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["resource_type", "resource_id"], name: "index_audit_logs_on_resource_type_and_resource_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "automation_executions", force: :cascade do |t|
    t.integer "automation_script_id", null: false
    t.integer "triggered_by_id"
    t.string "status", default: "pending", null: false
    t.datetime "started_at"
    t.datetime "completed_at"
    t.integer "duration_ms"
    t.text "execution_logs"
    t.text "error_message"
    t.string "trigger_type", default: "manual"
    t.integer "environment_id"
    t.text "results"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["automation_script_id"], name: "index_automation_executions_on_automation_script_id"
    t.index ["created_at"], name: "index_automation_executions_on_created_at"
    t.index ["status"], name: "index_automation_executions_on_status"
  end

  create_table "automation_scripts", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.string "script_path"
    t.integer "test_case_id"
    t.integer "user_id"
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["test_case_id"], name: "index_automation_scripts_on_test_case_id"
    t.index ["user_id"], name: "index_automation_scripts_on_user_id"
  end

  create_table "automation_templates", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "category"
    t.text "script_content"
    t.string "framework"
    t.string "language"
    t.boolean "is_public", default: false
    t.integer "user_id"
    t.string "tags"
    t.integer "usage_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_automation_templates_on_category"
    t.index ["user_id"], name: "index_automation_templates_on_user_id"
  end

  create_table "calendar_events", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.datetime "start_time", null: false
    t.string "event_type", null: false
    t.string "status", default: "scheduled"
    t.boolean "all_day", default: false
    t.string "location"
    t.text "attendees"
    t.integer "created_by_id", null: false
    t.string "eventable_type"
    t.integer "eventable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_calendar_events_on_created_by_id"
    t.index ["event_type"], name: "index_calendar_events_on_event_type"
    t.index ["eventable_type", "eventable_id"], name: "index_calendar_events_on_eventable"
    t.index ["start_time"], name: "index_calendar_events_on_start_time"
    t.index ["status"], name: "index_calendar_events_on_status"
  end

  create_table "comments", force: :cascade do |t|
    t.text "content"
    t.string "commentable_type", null: false
    t.integer "commentable_id", null: false
    t.integer "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "parent_comment_id"
    t.index ["commentable_type", "commentable_id"], name: "index_comments_on_commentable"
    t.index ["parent_comment_id"], name: "index_comments_on_parent_comment_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "dashboard_widgets", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "widget_type", null: false
    t.text "configuration"
    t.text "position"
    t.boolean "is_visible", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_dashboard_widgets_on_user_id"
    t.index ["widget_type"], name: "index_dashboard_widgets_on_widget_type"
  end

  create_table "document_approvals", force: :cascade do |t|
    t.integer "document_id", null: false
    t.integer "reviewer_id", null: false
    t.string "status", default: "pending", null: false
    t.text "comments"
    t.datetime "reviewed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["document_id"], name: "index_document_approvals_on_document_id"
    t.index ["reviewer_id"], name: "index_document_approvals_on_reviewer_id"
    t.index ["status"], name: "index_document_approvals_on_status"
  end

  create_table "document_versions", force: :cascade do |t|
    t.integer "document_id", null: false
    t.string "version_number", null: false
    t.text "change_summary"
    t.string "file_path"
    t.integer "file_size"
    t.integer "created_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_document_versions_on_created_by_id"
    t.index ["document_id"], name: "index_document_versions_on_document_id"
  end

  create_table "documents", force: :cascade do |t|
    t.string "title"
    t.text "description"
    t.string "file_path"
    t.integer "file_size"
    t.string "content_type"
    t.string "version"
    t.integer "folder_id"
    t.integer "user_id", null: false
    t.text "tags"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "project_id"
    t.string "approval_status", default: "draft", null: false
    t.bigint "reviewed_by_id"
    t.datetime "reviewed_at"
    t.index ["folder_id"], name: "index_documents_on_folder_id"
    t.index ["project_id"], name: "index_documents_on_project_id"
    t.index ["user_id"], name: "index_documents_on_user_id"
  end

  create_table "environment_configurations", force: :cascade do |t|
    t.integer "environment_id", null: false
    t.string "config_type", null: false
    t.string "name", null: false
    t.string "version"
    t.text "settings"
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["config_type"], name: "index_environment_configurations_on_config_type"
    t.index ["environment_id"], name: "index_environment_configurations_on_environment_id"
  end

  create_table "environment_variables", force: :cascade do |t|
    t.integer "environment_id", null: false
    t.string "key", null: false
    t.text "value"
    t.boolean "is_secret", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["environment_id", "key"], name: "index_environment_variables_on_environment_id_and_key", unique: true
    t.index ["environment_id"], name: "index_environment_variables_on_environment_id"
  end

  create_table "environments", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.string "environment_type"
    t.string "status"
    t.string "base_url"
    t.string "health_check_url"
    t.integer "project_id"
    t.text "database_connection"
    t.text "environment_variables"
    t.string "api_key"
    t.string "secret_key"
    t.text "target_devices"
    t.json "browser_matrix"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "health_status", default: "unknown"
    t.datetime "last_health_check_at"
    t.integer "created_by_id"
    t.index ["health_status"], name: "index_environments_on_health_status"
  end

  create_table "folders", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.integer "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id"], name: "index_folders_on_parent_id"
  end

  create_table "integration_logs", force: :cascade do |t|
    t.integer "integration_id", null: false
    t.string "action", null: false
    t.string "status", default: "success", null: false
    t.text "request_data"
    t.text "response_data"
    t.text "error_message"
    t.integer "duration_ms"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_integration_logs_on_created_at"
    t.index ["integration_id"], name: "index_integration_logs_on_integration_id"
    t.index ["status"], name: "index_integration_logs_on_status"
  end

  create_table "integrations", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.string "integration_type"
    t.string "status"
    t.integer "project_id"
    t.string "auth_type"
    t.text "api_key"
    t.string "username"
    t.string "password_digest"
    t.string "base_url"
    t.string "webhook_url"
    t.string "secret_token"
    t.boolean "auto_sync"
    t.integer "sync_interval"
    t.json "config_settings"
    t.json "event_types"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "invitations", force: :cascade do |t|
    t.string "email", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "role", null: false
    t.string "token", null: false
    t.integer "status", default: 0
    t.integer "invited_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_invitations_on_email"
    t.index ["invited_by_id"], name: "index_invitations_on_invited_by_id"
    t.index ["status"], name: "index_invitations_on_status"
    t.index ["token"], name: "index_invitations_on_token", unique: true
  end

  create_table "knowledge_base_categories", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.integer "parent_id"
    t.string "icon"
    t.integer "display_order", default: 0
    t.integer "article_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["display_order"], name: "index_knowledge_base_categories_on_display_order"
    t.index ["parent_id"], name: "index_knowledge_base_categories_on_parent_id"
  end

  create_table "labels", force: :cascade do |t|
    t.string "name"
    t.string "color"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "mentions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "mentioned_by_id", null: false
    t.string "mentionable_type"
    t.integer "mentionable_id"
    t.boolean "read", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["mentionable_type", "mentionable_id"], name: "index_mentions_on_mentionable_type_and_mentionable_id"
    t.index ["mentioned_by_id"], name: "index_mentions_on_mentioned_by_id"
    t.index ["read"], name: "index_mentions_on_read"
    t.index ["user_id"], name: "index_mentions_on_user_id"
  end

  create_table "notification_preferences", force: :cascade do |t|
    t.integer "user_id", null: false
    t.boolean "inapp_enabled", default: true
    t.boolean "inapp_test_runs", default: true
    t.boolean "inapp_tickets", default: true
    t.boolean "inapp_mentions", default: true
    t.boolean "inapp_assignments", default: true
    t.boolean "email_enabled", default: true
    t.string "email_digest_mode", default: "immediate"
    t.boolean "email_test_runs", default: true
    t.boolean "email_tickets", default: true
    t.boolean "email_mentions", default: true
    t.boolean "email_assignments", default: true
    t.time "do_not_disturb_start"
    t.time "do_not_disturb_end"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_notification_preferences_on_user_id", unique: true
  end

  create_table "notifications", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "title"
    t.text "message"
    t.string "notification_type"
    t.boolean "read", default: false
    t.string "notifiable_type"
    t.integer "notifiable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "category"
    t.string "priority", default: "medium"
    t.string "action_url"
    t.string "action_text"
    t.datetime "read_at"
    t.boolean "dismissed", default: false
    t.string "aggregation_key"
    t.integer "parent_notification_id"
    t.boolean "sent_via_email", default: false
    t.boolean "sent_via_push", default: false
    t.text "data"
    t.index ["aggregation_key"], name: "index_notifications_on_aggregation_key"
    t.index ["category"], name: "index_notifications_on_category"
    t.index ["dismissed"], name: "index_notifications_on_dismissed"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "project_users", force: :cascade do |t|
    t.integer "project_id", null: false
    t.integer "user_id", null: false
    t.string "role", default: "member"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "joined_at"
    t.integer "invited_by_id"
    t.datetime "last_activity_at"
    t.index ["invited_by_id"], name: "index_project_users_on_invited_by_id"
    t.index ["project_id", "user_id"], name: "index_project_users_on_project_id_and_user_id", unique: true
    t.index ["project_id"], name: "index_project_users_on_project_id"
    t.index ["user_id"], name: "index_project_users_on_user_id"
  end

  create_table "projects", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "repository_url"
    t.string "default_branch"
    t.integer "test_timeout"
    t.integer "retry_failed_tests"
    t.string "parallel_execution"
    t.string "email_notifications"
    t.string "webhook_url"
    t.boolean "email_notifications_enabled"
    t.string "avatar_url"
    t.string "visibility", default: "team"
    t.string "repository_type"
    t.integer "max_parallel_jobs", default: 1
    t.boolean "slack_notifications_enabled", default: false
    t.text "notification_events"
    t.text "settings_json"
    t.text "integration_config"
    t.integer "created_by_id"
    t.index ["created_by_id"], name: "index_projects_on_created_by_id"
    t.index ["visibility"], name: "index_projects_on_visibility"
  end

  create_table "reports", force: :cascade do |t|
    t.string "name", null: false
    t.string "report_type"
    t.text "configuration"
    t.integer "project_id"
    t.integer "created_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_reports_on_created_by_id"
    t.index ["project_id"], name: "index_reports_on_project_id"
    t.index ["report_type"], name: "index_reports_on_report_type"
  end

  create_table "scheduled_reports", force: :cascade do |t|
    t.integer "report_id", null: false
    t.string "schedule"
    t.text "recipients"
    t.string "format", default: "pdf"
    t.boolean "is_active", default: true
    t.datetime "last_run_at"
    t.datetime "next_run_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["is_active"], name: "index_scheduled_reports_on_is_active"
    t.index ["report_id"], name: "index_scheduled_reports_on_report_id"
  end

  create_table "sprints", force: :cascade do |t|
    t.string "name", null: false
    t.date "start_date", null: false
    t.date "end_date", null: false
    t.string "status", default: "planned", null: false
    t.integer "project_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "description"
    t.text "sprint_goal"
    t.string "team"
    t.integer "capacity"
    t.float "target_velocity"
    t.integer "completion_percentage"
    t.text "retrospective_notes"
    t.boolean "track_burndown"
    t.string "tags"
    t.index ["project_id"], name: "index_sprints_on_project_id"
  end

  create_table "test_artifacts", force: :cascade do |t|
    t.integer "test_run_id", null: false
    t.string "artifact_type"
    t.string "name"
    t.string "file_path"
    t.string "test_case"
    t.string "status"
    t.datetime "timestamp"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["test_run_id"], name: "index_test_artifacts_on_test_run_id"
  end

  create_table "test_case_attachments", force: :cascade do |t|
    t.integer "test_case_id", null: false
    t.string "filename", null: false
    t.string "content_type", null: false
    t.integer "file_size", null: false
    t.string "attachment_type", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["test_case_id", "attachment_type"], name: "idx_on_test_case_id_attachment_type_a382b58a47"
    t.index ["test_case_id"], name: "index_test_case_attachments_on_test_case_id"
  end

  create_table "test_cases", force: :cascade do |t|
    t.string "title"
    t.text "description"
    t.text "preconditions"
    t.text "steps"
    t.text "expected_results"
    t.string "status"
    t.integer "assigned_user_id"
    t.integer "folder_id"
    t.integer "created_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "test_data"
    t.integer "project_id"
    t.string "priority"
    t.string "test_type"
    t.text "post_conditions"
    t.string "automation_status"
    t.integer "estimated_duration"
    t.string "tags"
    t.string "test_case_id"
    t.text "actual_results"
    t.decimal "pass_rate", precision: 5, scale: 2
    t.datetime "last_executed_at"
    t.integer "execution_count", default: 0
    t.boolean "flaky_flag", default: false
    t.string "version", default: "1.0"
    t.decimal "coverage_percentage", precision: 5, scale: 2
    t.integer "parent_test_case_id"
    t.integer "template_id"
    t.integer "automation_script_id"
    t.index ["assigned_user_id"], name: "index_test_cases_on_assigned_user_id"
    t.index ["created_at"], name: "index_test_cases_on_created_at"
    t.index ["created_by_id"], name: "index_test_cases_on_created_by_id"
    t.index ["flaky_flag"], name: "index_test_cases_on_flaky_flag"
    t.index ["folder_id"], name: "index_test_cases_on_folder_id"
    t.index ["last_executed_at"], name: "index_test_cases_on_last_executed_at"
    t.index ["parent_test_case_id"], name: "index_test_cases_on_parent_test_case_id"
    t.index ["project_id"], name: "index_test_cases_on_project_id"
    t.index ["status"], name: "index_test_cases_on_status"
    t.index ["test_case_id"], name: "index_test_cases_on_test_case_id", unique: true
  end

  create_table "test_data_sets", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.integer "project_id"
    t.integer "environment_id"
    t.string "data_type"
    t.string "version"
    t.text "data_content"
    t.string "generation_method"
    t.integer "template_id"
    t.integer "records_count"
    t.boolean "is_active"
    t.boolean "mask_sensitive"
    t.string "tags"
    t.json "data_schema"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "test_data_snapshots", force: :cascade do |t|
    t.integer "test_data_set_id", null: false
    t.string "version", null: false
    t.text "data_content"
    t.text "change_summary"
    t.integer "created_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_test_data_snapshots_on_created_by_id"
    t.index ["test_data_set_id"], name: "index_test_data_snapshots_on_test_data_set_id"
  end

  create_table "test_data_templates", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.text "template_schema"
    t.text "generation_rules"
    t.integer "created_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_test_data_templates_on_created_by_id"
  end

  create_table "test_plan_test_cases", force: :cascade do |t|
    t.integer "test_plan_id", null: false
    t.integer "test_case_id", null: false
    t.integer "execution_order"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["test_case_id"], name: "index_test_plan_test_cases_on_test_case_id"
    t.index ["test_plan_id"], name: "index_test_plan_test_cases_on_test_plan_id"
  end

  create_table "test_plans", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.string "status"
    t.date "start_date"
    t.date "end_date"
    t.integer "created_by"
    t.integer "project_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "test_plan_number"
  end

  create_table "test_runs", force: :cascade do |t|
    t.integer "test_case_id"
    t.integer "user_id", null: false
    t.string "status"
    t.integer "execution_time"
    t.text "notes"
    t.text "evidence"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "automation_script_id"
    t.integer "project_id"
    t.text "settings"
    t.string "current_step"
    t.datetime "started_at"
    t.datetime "completed_at"
    t.integer "environment_id"
    t.string "browser_name"
    t.string "browser_version"
    t.string "os_details"
    t.string "screen_resolution"
    t.text "actual_results"
    t.text "screenshots_url"
    t.string "video_url"
    t.text "execution_logs"
    t.text "performance_metrics"
    t.text "failure_reason"
    t.boolean "is_automated", default: false
    t.string "triggered_by", default: "manual"
    t.string "repository_url"
    t.string "branch"
    t.index ["automation_script_id"], name: "index_test_runs_on_automation_script_id"
    t.index ["environment_id"], name: "index_test_runs_on_environment_id"
    t.index ["is_automated"], name: "index_test_runs_on_is_automated"
    t.index ["status", "updated_at"], name: "index_test_runs_on_status_and_updated_at"
    t.index ["status"], name: "index_test_runs_on_status"
    t.index ["test_case_id"], name: "index_test_runs_on_test_case_id"
    t.index ["triggered_by"], name: "index_test_runs_on_triggered_by"
    t.index ["user_id"], name: "index_test_runs_on_user_id"
  end

  create_table "ticket_labels", force: :cascade do |t|
    t.integer "ticket_id", null: false
    t.integer "label_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["label_id"], name: "index_ticket_labels_on_label_id"
    t.index ["ticket_id"], name: "index_ticket_labels_on_ticket_id"
  end

  create_table "ticket_relationships", force: :cascade do |t|
    t.integer "ticket_id", null: false
    t.integer "related_ticket_id", null: false
    t.string "relationship_type", null: false
    t.integer "created_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["related_ticket_id"], name: "index_ticket_relationships_on_related_ticket_id"
    t.index ["ticket_id", "related_ticket_id", "relationship_type"], name: "idx_ticket_relationships_unique", unique: true
    t.index ["ticket_id"], name: "index_ticket_relationships_on_ticket_id"
  end

  create_table "ticket_time_logs", force: :cascade do |t|
    t.integer "ticket_id", null: false
    t.integer "user_id", null: false
    t.decimal "time_spent", precision: 6, scale: 2, null: false
    t.text "description"
    t.datetime "logged_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ticket_id"], name: "index_ticket_time_logs_on_ticket_id"
    t.index ["user_id"], name: "index_ticket_time_logs_on_user_id"
  end

  create_table "ticket_watchers", force: :cascade do |t|
    t.integer "ticket_id", null: false
    t.integer "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ticket_id", "user_id"], name: "index_ticket_watchers_on_ticket_id_and_user_id", unique: true
    t.index ["ticket_id"], name: "index_ticket_watchers_on_ticket_id"
    t.index ["user_id"], name: "index_ticket_watchers_on_user_id"
  end

  create_table "tickets", force: :cascade do |t|
    t.string "title"
    t.text "description"
    t.string "status"
    t.string "severity"
    t.integer "assigned_user_id"
    t.integer "created_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "estimate", precision: 5, scale: 2
    t.integer "test_case_id"
    t.integer "test_run_id"
    t.integer "project_id"
    t.text "attachments"
    t.text "test_steps"
    t.text "expected_result"
    t.text "status_history"
    t.integer "sprint_id"
    t.string "ticket_id"
    t.string "priority"
    t.string "ticket_type"
    t.string "resolution"
    t.string "milestone"
    t.decimal "time_spent", precision: 5, scale: 2
    t.date "due_date"
    t.datetime "sla_due_date"
    t.text "actual_result"
    t.text "steps_to_reproduce"
    t.string "environment"
    t.string "browser_version"
    t.string "os_details"
    t.integer "duplicate_of_id"
    t.datetime "resolved_at"
    t.datetime "closed_at"
    t.text "watchers"
    t.index ["assigned_user_id"], name: "index_tickets_on_assigned_user_id"
    t.index ["created_by_id"], name: "index_tickets_on_created_by_id"
    t.index ["due_date"], name: "index_tickets_on_due_date"
    t.index ["priority"], name: "index_tickets_on_priority"
    t.index ["project_id"], name: "index_tickets_on_project_id"
    t.index ["resolved_at"], name: "index_tickets_on_resolved_at"
    t.index ["sprint_id"], name: "index_tickets_on_sprint_id"
    t.index ["test_case_id"], name: "index_tickets_on_test_case_id"
    t.index ["test_run_id"], name: "index_tickets_on_test_run_id"
    t.index ["ticket_id"], name: "index_tickets_on_ticket_id", unique: true
    t.index ["ticket_type"], name: "index_tickets_on_ticket_type"
  end

  create_table "user_calls", force: :cascade do |t|
    t.integer "caller_id", null: false
    t.integer "receiver_id", null: false
    t.integer "test_case_id"
    t.string "status", default: "initiated"
    t.string "call_type"
    t.datetime "started_at"
    t.datetime "ended_at"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["caller_id", "receiver_id"], name: "index_user_calls_on_caller_id_and_receiver_id"
    t.index ["caller_id"], name: "index_user_calls_on_caller_id"
    t.index ["receiver_id"], name: "index_user_calls_on_receiver_id"
    t.index ["status"], name: "index_user_calls_on_status"
    t.index ["test_case_id"], name: "index_user_calls_on_test_case_id"
  end

  create_table "user_invitations", force: :cascade do |t|
    t.string "email"
    t.string "status", default: "pending"
    t.integer "invited_by_id", null: false
    t.string "role"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "token"
    t.datetime "expires_at"
    t.index ["invited_by_id"], name: "index_user_invitations_on_invited_by_id"
  end

  create_table "user_settings", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "theme", default: "system"
    t.string "language", default: "en"
    t.string "timezone", default: "UTC"
    t.boolean "notifications_enabled", default: true
    t.boolean "email_notifications", default: true
    t.boolean "compact_view", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_user_settings_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email"
    t.string "password_digest"
    t.string "first_name"
    t.string "last_name"
    t.string "role"
    t.string "status"
    t.string "phone"
    t.string "location"
    t.date "joined_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "last_activity_at"
    t.integer "token_version", default: 0, null: false
    t.boolean "password_changed"
    t.string "otp_code"
    t.datetime "otp_expires_at"
    t.string "totp_secret"
    t.boolean "totp_enabled", default: false, null: false
    t.text "totp_backup_codes"
    t.text "avatar"
    t.text "bio"
    t.string "title"
    t.string "department"
    t.boolean "email_verified", default: false
    t.datetime "email_verified_at"
    t.text "dashboard_layout"
    t.datetime "last_login_at"
    t.integer "login_count", default: 0
    t.integer "failed_login_attempts", default: 0
    t.datetime "locked_at"
    t.string "api_key"
    t.datetime "api_key_last_used_at"
    t.index ["api_key"], name: "index_users_on_api_key", unique: true
    t.index ["email_verified"], name: "index_users_on_email_verified"
    t.index ["locked_at"], name: "index_users_on_locked_at"
    t.index ["token_version"], name: "index_users_on_token_version"
  end

  create_table "webhook_deliveries", force: :cascade do |t|
    t.integer "webhook_id", null: false
    t.string "event", null: false
    t.integer "http_status"
    t.text "request_body"
    t.text "response_body"
    t.boolean "success", default: false
    t.integer "duration_ms"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["webhook_id"], name: "index_webhook_deliveries_on_webhook_id"
  end

  create_table "webhooks", force: :cascade do |t|
    t.string "name", null: false
    t.string "url", null: false
    t.string "secret_token"
    t.json "events", default: []
    t.boolean "active", default: true
    t.integer "project_id"
    t.integer "created_by_id"
    t.integer "delivery_count", default: 0
    t.integer "failure_count", default: 0
    t.datetime "last_triggered_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_webhooks_on_active"
    t.index ["project_id"], name: "index_webhooks_on_project_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "automation_scripts", "test_cases"
  add_foreign_key "automation_scripts", "users"
  add_foreign_key "calendar_events", "users", column: "created_by_id"
  add_foreign_key "comments", "users"
  add_foreign_key "documents", "folders"
  add_foreign_key "documents", "projects"
  add_foreign_key "documents", "users"
  add_foreign_key "folders", "folders", column: "parent_id"
  add_foreign_key "invitations", "users", column: "invited_by_id"
  add_foreign_key "notification_preferences", "users"
  add_foreign_key "notifications", "users"
  add_foreign_key "project_users", "projects"
  add_foreign_key "project_users", "users"
  add_foreign_key "sprints", "projects"
  add_foreign_key "test_artifacts", "test_runs"
  add_foreign_key "test_case_attachments", "test_cases"
  add_foreign_key "test_cases", "folders"
  add_foreign_key "test_cases", "projects"
  add_foreign_key "test_cases", "users", column: "assigned_user_id"
  add_foreign_key "test_cases", "users", column: "created_by_id"
  add_foreign_key "test_plan_test_cases", "test_cases"
  add_foreign_key "test_plan_test_cases", "test_plans"
  add_foreign_key "test_runs", "automation_scripts"
  add_foreign_key "test_runs", "test_cases"
  add_foreign_key "test_runs", "users"
  add_foreign_key "ticket_labels", "labels"
  add_foreign_key "ticket_labels", "tickets"
  add_foreign_key "ticket_time_logs", "tickets"
  add_foreign_key "ticket_time_logs", "users"
  add_foreign_key "tickets", "projects"
  add_foreign_key "tickets", "test_cases"
  add_foreign_key "tickets", "test_runs"
  add_foreign_key "tickets", "users", column: "assigned_user_id"
  add_foreign_key "tickets", "users", column: "created_by_id"
  add_foreign_key "user_calls", "test_cases"
  add_foreign_key "user_calls", "users", column: "caller_id"
  add_foreign_key "user_calls", "users", column: "receiver_id"
  add_foreign_key "user_invitations", "users", column: "invited_by_id"
  add_foreign_key "user_settings", "users"
  add_foreign_key "webhook_deliveries", "webhooks"
end

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

ActiveRecord::Schema[7.1].define(version: 2026_02_13_090244) do
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
    t.index ["commentable_type", "commentable_id"], name: "index_comments_on_commentable"
    t.index ["user_id"], name: "index_comments_on_user_id"
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
    t.index ["folder_id"], name: "index_documents_on_folder_id"
    t.index ["project_id"], name: "index_documents_on_project_id"
    t.index ["user_id"], name: "index_documents_on_user_id"
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
  end

  create_table "folders", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.integer "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id"], name: "index_folders_on_parent_id"
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

  create_table "labels", force: :cascade do |t|
    t.string "name"
    t.string "color"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "project_users", force: :cascade do |t|
    t.integer "project_id", null: false
    t.integer "user_id", null: false
    t.string "role", default: "member"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
  end

  create_table "sprints", force: :cascade do |t|
    t.string "name", null: false
    t.date "start_date", null: false
    t.date "end_date", null: false
    t.string "status", default: "planned", null: false
    t.integer "project_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
    t.index ["assigned_user_id"], name: "index_test_cases_on_assigned_user_id"
    t.index ["created_at"], name: "index_test_cases_on_created_at"
    t.index ["created_by_id"], name: "index_test_cases_on_created_by_id"
    t.index ["folder_id"], name: "index_test_cases_on_folder_id"
    t.index ["project_id"], name: "index_test_cases_on_project_id"
    t.index ["status"], name: "index_test_cases_on_status"
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
    t.index ["automation_script_id"], name: "index_test_runs_on_automation_script_id"
    t.index ["status", "updated_at"], name: "index_test_runs_on_status_and_updated_at"
    t.index ["status"], name: "index_test_runs_on_status"
    t.index ["test_case_id"], name: "index_test_runs_on_test_case_id"
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
    t.index ["assigned_user_id"], name: "index_tickets_on_assigned_user_id"
    t.index ["created_by_id"], name: "index_tickets_on_created_by_id"
    t.index ["project_id"], name: "index_tickets_on_project_id"
    t.index ["sprint_id"], name: "index_tickets_on_sprint_id"
    t.index ["test_case_id"], name: "index_tickets_on_test_case_id"
    t.index ["test_run_id"], name: "index_tickets_on_test_run_id"
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
    t.index ["token_version"], name: "index_users_on_token_version"
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
end

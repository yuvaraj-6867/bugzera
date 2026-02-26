Rails.application.routes.draw do
  namespace :api do
    # Admin routes
    post 'admin/clear_all_data', to: 'admin#clear_all_data'
    
    # Dashboard routes
    namespace :v1 do
      # ── Auth ──────────────────────────────────────────────────────────────────
      post  'auth/login',           to: 'auth#login'
      post  'auth/register',        to: 'auth#register'
      post  'auth/logout',          to: 'auth#logout'
      post  'auth/refresh_token',   to: 'auth#refresh_token'
      patch 'auth/change_password', to: 'auth#change_password'
      post  'auth/forgot_password', to: 'auth#forgot_password'
      post  'auth/reset_password',  to: 'auth#reset_password'
      post  'auth/contact_admin',   to: 'auth#contact_admin'

      # ── TOTP 2FA ──────────────────────────────────────────────────────────────
      get  'totp/setup',   to: 'totp#setup'
      post 'totp/enable',  to: 'totp#enable'
      post 'totp/disable', to: 'totp#disable'
      get  'totp/status',  to: 'totp#status'

      # ── Dashboard ─────────────────────────────────────────────────────────────
      get 'dashboard/metrics',       to: 'dashboard#metrics'
      get 'dashboard/user_activity', to: 'dashboard#user_activity'
      get 'dashboard/trends',        to: 'dashboard#trends'
      put 'dashboard/layout',        to: 'dashboard#update_layout'

      # ── Users ─────────────────────────────────────────────────────────────────
      resources :users, only: [:index, :show, :create, :update, :destroy] do
        collection do
          get  :current
          post :invite
        end
        member do
          post  :deactivate
          post  :activate
          get   :activity
          put   :password
        end
      end
      patch 'profile/avatar', to: 'users#update_avatar'
      resources :user_invitations, only: [:index, :create]

      # ── Projects ──────────────────────────────────────────────────────────────
      resources :projects, only: [:index, :create, :show, :update, :destroy] do
        member do
          get    :users
          post   :users,                to: 'projects#add_user'
          delete 'users/:user_id',      to: 'projects#remove_user'
          patch  'users/:user_id',      to: 'projects#update_user_role'
          get    :test_cases
          get    :statistics
        end
      end

      # ── Test Cases ────────────────────────────────────────────────────────────
      resources :test_cases, only: [:index, :create, :show, :update, :destroy] do
        collection do
          post :import
          get  :export
          post :bulk_delete
          post :bulk_update_status
        end
        member do
          post :clone
          post :run
          get  :history
          get  :attachments
          post :attachments, to: 'test_cases#upload_attachment'
        end
        resources :comments, only: [:index, :create, :update, :destroy]
      end

      # ── Test Runs ─────────────────────────────────────────────────────────────
      resources :test_runs, only: [:index, :create, :show, :update, :destroy] do
        collection do
          get :compare
        end
        member do
          post :rerun
          get  :artifacts
        end
      end

      # ── Test Plans ────────────────────────────────────────────────────────────
      resources :test_plans, only: [:index, :create, :show, :update, :destroy] do
        member do
          post   'add_test_case'
          delete 'remove_test_case/:test_case_id', to: 'test_plans#remove_test_case'
        end
      end

      # ── Tickets ───────────────────────────────────────────────────────────────
      resources :tickets, only: [:index, :create, :show, :update, :destroy] do
        collection do
          post :bulk_delete
          post :bulk_update_status
        end
        member do
          post :watch
          delete :unwatch
        end
        resources :comments,             only: [:index, :create, :update, :destroy]
        resources :ticket_time_logs,     only: [:index, :create, :destroy]
        resources :ticket_relationships, only: [:index, :create, :destroy]
      end

      # ── Sprints ───────────────────────────────────────────────────────────────
      resources :sprints, only: [:index, :create, :show, :update, :destroy]

      # ── Calendar ──────────────────────────────────────────────────────────────
      resources :calendar_events, only: [:index, :create, :show, :update, :destroy] do
        collection do
          get  :upcoming
          post :import
          get  :export
        end
      end

      # ── Documents ─────────────────────────────────────────────────────────────
      resources :documents, only: [:index, :create, :show, :update, :destroy] do
        member do
          get  :download
          post :approve
          post :reject
          get  :versions
          post :versions, to: 'documents#upload_version'
        end
      end
      resources :folders, only: [:index, :create, :show, :update, :destroy]

      # ── Environments ──────────────────────────────────────────────────────────
      resources :environments, only: [:index, :create, :show, :update, :destroy] do
        member do
          get  :health
          post :health_check
        end
        resources :environment_variables, only: [:index, :create, :update, :destroy]
      end

      # ── Automation ────────────────────────────────────────────────────────────
      resources :automation_scripts, only: [:index, :create, :show, :update, :destroy] do
        member do
          post :execute
          get  :executions
        end
      end
      resources :automation_templates, only: [:index, :create, :update, :destroy] do
        member do
          post :use
        end
      end

      # ── Test Data ─────────────────────────────────────────────────────────────
      resources :test_data_sets, only: [:index, :create, :show, :update, :destroy] do
        member do
          get  :export
          post :snapshot
        end
      end
      post 'test_data/generate', to: 'test_data_sets#generate'
      post 'test_data/import',   to: 'test_data_sets#import'

      # ── Integrations ──────────────────────────────────────────────────────────
      resources :integrations, only: [:index, :create, :show, :update, :destroy] do
        member do
          get  :health
          post :sync
          get  :logs
        end
      end
      resources :webhooks, only: [:index, :create, :update, :destroy] do
        member do
          get  :deliveries
          post :test_delivery
        end
      end

      # ── Knowledge Base ────────────────────────────────────────────────────────
      resources :articles, only: [:index, :create, :show, :update, :destroy] do
        member do
          post :feedback
        end
        collection do
          get :search
        end
      end
      resources :knowledge_base_categories, only: [:index, :create, :show, :update, :destroy]

      # ── Labels ────────────────────────────────────────────────────────────────
      resources :labels, only: [:index, :create, :show, :update, :destroy]

      # ── Analytics ─────────────────────────────────────────────────────────────
      get  'analytics/overview',         to: 'analytics#overview'
      get  'analytics/trends',           to: 'analytics#trends'
      get  'analytics/by_project',       to: 'analytics#by_project'
      get  'analytics/ticket_breakdown', to: 'analytics#ticket_breakdown'
      get  'analytics/sprint_velocity',  to: 'analytics#sprint_velocity'
      get  'analytics/dashboard',        to: 'analytics#dashboard'
      put  'analytics/dashboard',        to: 'analytics#update_dashboard'
      get  'analytics/reports/:type',    to: 'analytics#report'
      post 'analytics/export',           to: 'analytics#export'
      post 'analytics/schedule',         to: 'analytics#schedule'
      resources :reports, only: [:index, :create, :show, :update, :destroy]
      resources :scheduled_reports, only: [:index, :create, :update, :destroy]

      # ── Activities Feed ───────────────────────────────────────────────────────
      resources :activities, only: [:index] do
        collection do
          get  :mentions
          post :mark_read
          get  :export
        end
      end

      # ── Notifications ─────────────────────────────────────────────────────────
      resources :notifications, only: [:index, :destroy] do
        collection do
          get   :unread_count
          patch :mark_all_read
        end
        member do
          patch :read
        end
      end
      get 'notifications/preferences', to: 'notifications#preferences'
      put 'notifications/preferences', to: 'notifications#update_preferences'

      # ── Settings ──────────────────────────────────────────────────────────────
      get   'settings', to: 'settings#show'
      patch 'settings', to: 'settings#update'

      # ── Audit Logs ────────────────────────────────────────────────────────────
      resources :audit_logs, only: [:index]

      # ── Document Imports ──────────────────────────────────────────────────────
      post 'document_imports/preview',      to: 'document_imports#preview'
      post 'document_imports/create_items', to: 'document_imports#create_items'
    end
    
    # Settings
    get 'settings', to: 'settings#show'
    patch 'settings', to: 'settings#update'

    # Slack integration
    post 'slack/configure', to: 'slack#configure'
  end
end
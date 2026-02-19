Rails.application.routes.draw do
  namespace :api do
    # Admin routes
    post 'admin/clear_all_data', to: 'admin#clear_all_data'
    
    # Dashboard routes
    namespace :v1 do
      get 'dashboard/metrics', to: 'dashboard#metrics'
      get 'dashboard/user_activity', to: 'dashboard#user_activity'
      get 'dashboard/trends', to: 'dashboard#trends'

      
      resources :users, only: [:index, :show, :create, :update, :destroy] do
        collection do
          get :current
        end
      end
      resources :user_invitations, only: [:index, :create]
      resources :projects, only: [:index, :create, :show, :update] do
        member do
          get :users
          post :users, to: 'projects#add_user'
          delete 'users/:user_id', to: 'projects#remove_user'
          get :test_cases
        end
      end
      resources :test_cases, only: [:index, :create, :show, :update, :destroy]
      resources :test_plans, only: [:index, :create, :show, :update, :destroy] do
        member do
          post 'add_test_case'
          delete 'remove_test_case/:test_case_id', to: 'test_plans#remove_test_case'
        end
      end
      resources :tickets, only: [:index, :create, :show, :update, :destroy]
      resources :sprints, only: [:index, :create, :show, :update, :destroy]
      resources :automation_scripts, only: [:index, :create, :show, :update, :destroy] do
        member do
          post :execute
        end
      end
      resources :test_runs, only: [:index, :create, :show]
      resources :calendar_events, only: [:index, :create, :show, :update, :destroy]
      resources :documents, only: [:index, :create, :show, :update, :destroy] do
        member do
          get :download
        end
      end
      resources :environments, only: [:index, :create, :show, :update, :destroy]
      resources :test_data_sets, only: [:index, :create, :show, :update, :destroy]
      resources :integrations, only: [:index, :create, :show, :update, :destroy]
      resources :articles, only: [:index, :create, :show, :update, :destroy]

      post 'document_imports/preview', to: 'document_imports#preview'
      post 'document_imports/create_items', to: 'document_imports#create_items'

      post 'auth/login', to: 'auth#login'
      post 'auth/register', to: 'auth#register'
      patch 'auth/change_password', to: 'auth#change_password'
    end
    
    # Settings
    get 'settings', to: 'settings#show'
    patch 'settings', to: 'settings#update'

    # Slack integration
    post 'slack/configure', to: 'slack#configure'
  end
end
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
      resources :tickets, only: [:index, :create, :show, :update, :destroy]
      resources :sprints, only: [:index, :create, :show, :update, :destroy]
      resources :test_runs, only: [:index, :create, :show]
      resources :calendar_events, only: [:index, :create, :show, :update, :destroy]
      resources :documents, only: [:index, :create, :show, :update, :destroy] do
        member do
          get :download
        end
      end
      
      post 'document_imports/preview', to: 'document_imports#preview'
      post 'document_imports/create_items', to: 'document_imports#create_items'

      post 'auth/login', to: 'auth#login'
      post 'auth/register', to: 'auth#register'
      patch 'auth/change_password', to: 'auth#change_password'
    end
    
    # Slack integration
    post 'slack/configure', to: 'slack#configure'
  end
end
class CreateWebhooks < ActiveRecord::Migration[7.1]
  def change
    create_table :webhooks do |t|
      t.string   :name,       null: false
      t.string   :url,        null: false
      t.string   :secret_token
      t.json     :events,     default: []
      t.boolean  :active,     default: true
      t.integer  :project_id
      t.integer  :created_by_id
      t.integer  :delivery_count,  default: 0
      t.integer  :failure_count,   default: 0
      t.datetime :last_triggered_at
      t.timestamps
    end
    add_index :webhooks, :project_id
    add_index :webhooks, :active

    create_table :webhook_deliveries do |t|
      t.integer  :webhook_id, null: false
      t.string   :event,      null: false
      t.integer  :http_status
      t.text     :request_body
      t.text     :response_body
      t.boolean  :success,    default: false
      t.integer  :duration_ms
      t.timestamps
    end
    add_index :webhook_deliveries, :webhook_id
    add_foreign_key :webhook_deliveries, :webhooks
  end
end

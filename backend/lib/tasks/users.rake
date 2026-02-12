namespace :users do
  desc "List all users"
  task list: :environment do
    User.all.each do |user|
      puts "#{user.email} - #{user.full_name} (#{user.role})"
    end
  end
end
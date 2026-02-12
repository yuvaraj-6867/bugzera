namespace :db do
  desc "Reset database for production"
  task reset_production: :environment do
    if Rails.env.production?
      puts "Resetting production database..."
      Rake::Task['db:drop'].invoke
      Rake::Task['db:create'].invoke
      Rake::Task['db:migrate'].invoke
      Rake::Task['db:seed'].invoke
      puts "Database reset complete!"
    else
      puts "This task only runs in production environment"
    end
  end
end
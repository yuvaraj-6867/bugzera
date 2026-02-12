# Delete all data in correct order to avoid foreign key constraints
if ActiveRecord::Base.connection.table_exists?(:notifications)
  Notification.delete_all
end

if ActiveRecord::Base.connection.table_exists?(:user_invitations)
  UserInvitation.delete_all
end

if ActiveRecord::Base.connection.table_exists?(:automation_scripts)
  AutomationScript.delete_all
end

if ActiveRecord::Base.connection.table_exists?(:documents)
  Document.delete_all
end

if ActiveRecord::Base.connection.table_exists?(:test_runs)
  TestRun.delete_all
end

if ActiveRecord::Base.connection.table_exists?(:tickets)
  Ticket.delete_all
end

if ActiveRecord::Base.connection.table_exists?(:test_cases)
  TestCase.delete_all
end

if ActiveRecord::Base.connection.table_exists?(:projects)
  Project.delete_all
end

if ActiveRecord::Base.connection.table_exists?(:users)
  User.delete_all
end

# QA Manager
User.create!(
  email: 'manager@company.com',
  password: 'yuva123',
  first_name: 'Yuva',
  last_name: 'Iyer',
  role: 'manager',
  status: 'active',
  phone: '+91 9876543210',
  location: 'Coimbatore, Tamil Nadu, India',
  joined_date: Date.current
)
# Admin
User.create!(
  email: 'admin@company.com',
  password: 'yuva123',
  first_name: 'Yuva',
  last_name: 'Nair',
  role: 'admin',
  status: 'active',
  phone: '+91 9876543212',
  location: 'Chennai, Tamil Nadu, India',
  joined_date: Date.current
)
puts "Created users:"
puts "Total users: #{User.count}"



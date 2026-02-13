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

# Admin User
admin = User.create!(
  email: 'admin@bugzera.com',
  password: 'password123',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  status: 'active',
  phone: '+91 9876543210',
  location: 'Chennai, Tamil Nadu, India',
  joined_date: Date.current
)

# QA Manager
manager = User.create!(
  email: 'manager@bugzera.com',
  password: 'password123',
  first_name: 'Yuva',
  last_name: 'Iyer',
  role: 'manager',
  status: 'active',
  phone: '+91 9876543211',
  location: 'Coimbatore, Tamil Nadu, India',
  joined_date: Date.current
)

# Team Member 1
member1 = User.create!(
  email: 'raj@bugzera.com',
  password: 'password123',
  first_name: 'Raj',
  last_name: 'Kumar',
  role: 'member',
  status: 'active',
  phone: '+91 9876543212',
  location: 'Bangalore, Karnataka, India',
  joined_date: Date.current
)

puts "✅ Created #{User.count} users:"
User.all.each do |user|
  puts "  - #{user.email} (#{user.role}) - Password: password123"
end



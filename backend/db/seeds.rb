admin = User.find_or_create_by!(email: 'admin@bugzera.com') do |u|
  u.password = 'password123'
  u.first_name = 'Admin'; u.last_name = 'User'; u.role = 'admin'; u.status = 'active'
  u.phone = '+91 9876543210'; u.location = 'Chennai, Tamil Nadu, India'; u.joined_date = Date.current
end

manager = User.create!(
  email: 'manager@bugzera.com', password: 'password123',
  first_name: 'Yuva', last_name: 'Iyer', role: 'manager', status: 'active',
  phone: '+91 9876543211', location: 'Coimbatore, Tamil Nadu, India', joined_date: Date.current
)

member1 = User.create!(
  email: 'member@bugzera.com', password: 'password123',
  first_name: 'Member', last_name: 'Kumar', role: 'member', status: 'active',
  phone: '+91 9876543212', location: 'Bangalore, Karnataka, India', joined_date: Date.current
)

User.create!(
  email: 'developer@bugzera.com', password: 'password123',
  first_name: 'Dev', last_name: 'Kumar', role: 'developer', status: 'active',
  phone: '+91 9876543213', location: 'Hyderabad, Telangana, India', joined_date: Date.current
)

User.create!(
  email: 'viewer@bugzera.com', password: 'password123',
  first_name: 'View', last_name: 'Only', role: 'viewer', status: 'active',
  phone: '+91 9876543214', location: 'Mumbai, Maharashtra, India', joined_date: Date.current
)
puts "🎉 Seed complete! Login credentials:"
puts "   admin@bugzera.com     / password123  (Admin)"
puts "   manager@bugzera.com   / password123  (Manager)"
puts "   member@bugzera.com    / password123  (Member)"
puts "   developer@bugzera.com / password123  (Developer)"
puts "   viewer@bugzera.com    / password123  (Viewer)"
puts "✅ Created #{User.count} users"

# Create sample audit logs
AuditLog.create!([
  { action: 'login', user: admin, ip_address: '192.168.1.1', created_at: 2.days.ago },
  { action: 'project_created', user: admin, resource_type: 'Project', resource_id: 1, created_at: 1.day.ago },
  { action: 'settings_changed', user: admin, details: 'Updated notification preferences', created_at: 12.hours.ago },
  { action: 'user_created', user: admin, resource_type: 'User', resource_id: manager.id, details: "Created user #{manager.email}", created_at: 6.hours.ago },
  { action: 'login', user: manager, ip_address: '192.168.1.2', created_at: 3.hours.ago },
])
puts "✅ Created #{AuditLog.count} audit log entries"

# cd /home/yuvaraj/bugzera/backend
# rails db:drop db:create db:migrate db:seed
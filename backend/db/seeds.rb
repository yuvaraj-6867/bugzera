admin = User.create!(
  email: 'admin@bugzera.com', password: 'password123',
  first_name: 'Admin', last_name: 'User', role: 'admin', status: 'active',
  phone: '+91 9876543210', location: 'Chennai, Tamil Nadu, India', joined_date: Date.current
)

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

# cd /home/yuvaraj/bugzera/backend
# rails db:drop db:create db:migrate db:seed
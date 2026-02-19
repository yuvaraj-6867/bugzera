import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

const Users = () => {
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: '',
    status: 'active',
    team: '',
    department: '',
    phone: '',
    location: '',
    timezone: 'UTC',
    language: 'en',
    jobTitle: '',
    employeeId: '',
    manager: '',
    joiningDate: '',
    permissions: {
      projects: false,
      testCases: false,
      testRuns: false,
      tickets: false,
      reports: false,
      users: false,
    },
    notifications: {
      email: true,
      slack: false,
      browser: false,
    },
    bio: ''
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const result = await response.json()
      setUsers(result.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      const [category, field] = name.split('.')

      if (category === 'permissions') {
        setFormData(prev => ({
          ...prev,
          permissions: {
            ...prev.permissions,
            [field]: checkbox.checked
          }
        }))
      } else if (category === 'notifications') {
        setFormData(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            [field]: checkbox.checked
          }
        }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      // Send to backend API
      const response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          user: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            username: formData.username,
            password: formData.password,
            role: formData.role,
            status: formData.status,
            team: formData.team,
            department: formData.department,
            phone: formData.phone,
            location: formData.location,
            timezone: formData.timezone,
            language: formData.language,
            job_title: formData.jobTitle,
            employee_id: formData.employeeId,
            manager_id: formData.manager,
            joining_date: formData.joiningDate,
            permissions: formData.permissions,
            notifications: formData.notifications,
            bio: formData.bio
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create user')
      }

      const data = await response.json()
      console.log('User created:', data)

      alert('✅ User created successfully and saved to database!')

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        role: '',
        status: 'active',
        team: '',
        department: '',
        phone: '',
        location: '',
        timezone: 'UTC',
        language: 'en',
        jobTitle: '',
        employeeId: '',
        manager: '',
        joiningDate: '',
        permissions: {
          projects: false,
          testCases: false,
          testRuns: false,
          tickets: false,
          reports: false,
          users: false,
        },
        notifications: {
          email: true,
          slack: false,
          browser: false,
        },
        bio: ''
      })
      setShowModal(false)
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to create user'}`)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('users.title')}</h1>
          <p className="text-gray-600">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <span>+</span> New User
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading users...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No users yet. Add your first team member!</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && users.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Team Members ({users.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name || `${user.first_name} ${user.last_name}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.joined_date ? new Date(user.joined_date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New User</h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="username"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter password"
                    required
                  />
                </div>

                {/* Role & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Role *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select role</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Team & Department */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Team</label>
                    <select
                      name="team"
                      value={formData.team}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select team</option>
                      <option value="qa">QA Team</option>
                      <option value="dev">Development Team</option>
                      <option value="devops">DevOps Team</option>
                      <option value="support">Support Team</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select department</option>
                      <option value="engineering">Engineering</option>
                      <option value="qa">Quality Assurance</option>
                      <option value="product">Product</option>
                      <option value="management">Management</option>
                    </select>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                {/* Timezone & Language */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Timezone</label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Asia/Kolkata">India (IST)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Language</label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Job Title</label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Senior QA Engineer"
                    />
                  </div>
                  <div>
                    <label className="form-label">Employee ID</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="EMP-12345"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Manager</label>
                    <select
                      name="manager"
                      value={formData.manager}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">No manager</option>
                      <option value="1">John Doe</option>
                      <option value="2">Jane Smith</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Joining Date</label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="form-label">Permissions</label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="perm-projects"
                        name="permissions.projects"
                        checked={formData.permissions.projects}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <label htmlFor="perm-projects" className="text-sm text-gray-700">Create/Edit Projects</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="perm-testcases"
                        name="permissions.testCases"
                        checked={formData.permissions.testCases}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <label htmlFor="perm-testcases" className="text-sm text-gray-700">Create/Edit Test Cases</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="perm-testruns"
                        name="permissions.testRuns"
                        checked={formData.permissions.testRuns}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <label htmlFor="perm-testruns" className="text-sm text-gray-700">Execute Test Runs</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="perm-tickets"
                        name="permissions.tickets"
                        checked={formData.permissions.tickets}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <label htmlFor="perm-tickets" className="text-sm text-gray-700">Create/Manage Tickets</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="perm-reports"
                        name="permissions.reports"
                        checked={formData.permissions.reports}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <label htmlFor="perm-reports" className="text-sm text-gray-700">View Reports & Analytics</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="perm-users"
                        name="permissions.users"
                        checked={formData.permissions.users}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <label htmlFor="perm-users" className="text-sm text-gray-700">Manage Users</label>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div>
                  <label className="form-label">Notification Preferences</label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="notif-email"
                        name="notifications.email"
                        checked={formData.notifications.email}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <label htmlFor="notif-email" className="text-sm text-gray-700">Email Notifications</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="notif-slack"
                        name="notifications.slack"
                        checked={formData.notifications.slack}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <label htmlFor="notif-slack" className="text-sm text-gray-700">Slack Notifications</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="notif-browser"
                        name="notifications.browser"
                        checked={formData.notifications.browser}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <label htmlFor="notif-browser" className="text-sm text-gray-700">Browser Notifications</label>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div>
                  <label className="form-label">Bio/Notes</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Additional information about the user..."
                    rows={3}
                  ></textarea>
                </div>

                {/* Buttons moved inside form */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users

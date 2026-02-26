import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

const Users = () => {
  const { t } = useLanguage()
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [showModal, setShowModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', first_name: '', last_name: '', role: 'member' })
  const [inviting, setInviting] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editUserData, setEditUserData] = useState({ first_name: '', last_name: '', email: '', role: '', phone: '', location: '' })
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
      const response = await fetch('/api/v1/users', {
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

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setEditUserData({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '', role: user.role || '', phone: user.phone || '', location: user.location || '' })
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    const res = await fetch(`/api/v1/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({ user: editUserData })
    })
    if (res.ok) { setShowEditModal(false); fetchUsers() }
    else { const e = await res.json(); alert(e.errors || 'Update failed') }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Delete this user?')) return
    try {
      const res = await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!res.ok) throw new Error('Failed to delete user')
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Delete failed'}`)
    }
  }

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) { alert('Email is required'); return }
    setInviting(true)
    try {
      const res = await fetch('/api/v1/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify(inviteForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invite failed')
      alert('✅ Invitation sent successfully!')
      setInviteForm({ email: '', first_name: '', last_name: '', role: 'member' })
      setShowInviteModal(false)
      fetchUsers()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Invite failed'}`)
    } finally {
      setInviting(false)
    }
  }

  const handleToggleStatus = async (user: any) => {
    const endpoint = user.status === 'active' ? 'deactivate' : 'activate'
    const res = await fetch(`/api/v1/users/${user.id}/${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    })
    if (res.ok) fetchUsers()
  }

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
      const response = await fetch('/api/v1/users', {
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
        {canCreate.users && (
          <div className="flex gap-2">
            <button onClick={() => setShowInviteModal(true)} className="btn btn-outline">
              ✉ Invite by Email
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              <span>+</span> New User
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && <BLoader />}

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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                        user.role === 'admin'     ? 'bg-red-100 text-red-800' :
                        user.role === 'manager'   ? 'bg-blue-100 text-blue-800' :
                        user.role === 'member'    ? 'bg-green-100 text-green-800' :
                        user.role === 'developer' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-700'
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit.users && (
                          <button title="Edit" onClick={() => handleEditUser(user)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        {canEdit.users && (
                          <button
                            title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1.5 rounded transition-colors ${user.status === 'active' ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                          >
                            {user.status === 'active' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                          </button>
                        )}
                        {canDelete.users && (
                          <button title="Delete" onClick={() => handleDeleteUser(user.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit User</h2>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name</label>
                  <input type="text" value={editUserData.first_name} onChange={e => setEditUserData(prev => ({ ...prev, first_name: e.target.value }))} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input type="text" value={editUserData.last_name} onChange={e => setEditUserData(prev => ({ ...prev, last_name: e.target.value }))} className="form-input" />
                </div>
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" value={editUserData.email} onChange={e => setEditUserData(prev => ({ ...prev, email: e.target.value }))} className="form-input" />
              </div>
              <div>
                <label className="form-label">Role</label>
                <select value={editUserData.role} onChange={e => setEditUserData(prev => ({ ...prev, role: e.target.value }))} className="form-select">
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Phone</label>
                  <input type="text" value={editUserData.phone} onChange={e => setEditUserData(prev => ({ ...prev, phone: e.target.value }))} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <input type="text" value={editUserData.location} onChange={e => setEditUserData(prev => ({ ...prev, location: e.target.value }))} className="form-input" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateUser}>Save Changes</button>
            </div>
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Invite Team Member</h2>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowInviteModal(false)}>×</button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="user@example.com"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">First Name</label>
                  <input className="form-input" placeholder="First"
                    value={inviteForm.first_name}
                    onChange={e => setInviteForm(f => ({ ...f, first_name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input className="form-input" placeholder="Last"
                    value={inviteForm.last_name}
                    onChange={e => setInviteForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Role</label>
                <select className="form-select" value={inviteForm.role}
                  onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="member">Member</option>
                  <option value="developer">Developer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <p className="text-xs text-gray-400">An email with login credentials will be sent to the invited user.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowInviteModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleInvite} disabled={inviting}>
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users

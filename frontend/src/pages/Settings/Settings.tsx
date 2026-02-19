import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage, type Language } from '../../contexts/LanguageContext'

const Settings = () => {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'notifications' | 'security'>('profile')
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const headers = {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/settings', { headers })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (params: any) => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('http://localhost:3000/api/settings', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ settings: params })
      })
      if (res.ok) {
        setMessage('Settings saved successfully')
        fetchSettings()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save settings')
      }
    } catch {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (current: string, newPass: string) => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/change_password', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ current_password: current, new_password: newPass })
      })
      if (res.ok) {
        setMessage('Password changed successfully')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const data = await res.json()
        setMessage(data.error || 'Failed to change password')
      }
    } catch {
      setMessage('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile' as const, labelKey: 'settings.profile' },
    { id: 'general' as const, labelKey: 'settings.general' },
    { id: 'notifications' as const, labelKey: 'settings.notifications' },
    { id: 'security' as const, labelKey: 'settings.security' },
  ]

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-transparent p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#0F172A] dark:text-gray-100 mb-2">{t('settings.title')}</h1>
        <p className="text-[#64748B] dark:text-gray-400">{t('settings.subtitle')}</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent-neon text-accent-neon font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading settings...</div>
          ) : (
            <>
              {activeTab === 'profile' && <ProfileSettings user={user} />}
              {activeTab === 'general' && <GeneralSettings settings={settings} onSave={saveSettings} saving={saving} />}
              {activeTab === 'notifications' && <NotificationSettings settings={settings} onSave={saveSettings} saving={saving} />}
              {activeTab === 'security' && <SecuritySettings onChangePassword={changePassword} saving={saving} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const ProfileSettings = ({ user }: { user: any }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#0F172A] dark:text-gray-100 mb-4">Profile Information</h3>
      <div className="flex items-center gap-6 mb-6">
        <div className="w-20 h-20 rounded-full bg-accent-neon/10 flex items-center justify-center text-2xl font-bold text-accent-neon">
          {user.first_name?.[0]}{user.last_name?.[0]}
        </div>
        <div>
          <p className="text-xl font-semibold text-[#0F172A] dark:text-gray-100">{user.first_name} {user.last_name}</p>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">{user.role}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">First Name</p>
          <p className="font-semibold text-[#0F172A] dark:text-gray-100">{user.first_name || '-'}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Last Name</p>
          <p className="font-semibold text-[#0F172A] dark:text-gray-100">{user.last_name || '-'}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
          <p className="font-semibold text-[#0F172A] dark:text-gray-100">{user.email || '-'}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
          <p className="font-semibold text-[#0F172A] dark:text-gray-100 capitalize">{user.role || '-'}</p>
        </div>
      </div>
    </div>
  )
}

const GeneralSettings = ({ settings, onSave, saving }: { settings: any, onSave: (p: any) => void, saving: boolean }) => {
  const { theme: currentTheme, setTheme: applyTheme } = useTheme()
  const { language: currentLanguage, setLanguage: applyLanguage, t, languageNames } = useLanguage()
  const [theme, setThemeLocal] = useState(currentTheme)
  const [language, setLanguageLocal] = useState(currentLanguage)
  const [timezone, setTimezone] = useState(settings?.appearance?.timezone || 'UTC')
  const [compactView, setCompactView] = useState(settings?.appearance?.compact_view || false)

  const timezones = settings?.available_options?.timezones || []

  const handleThemeChange = (value: string) => {
    const th = value as 'light' | 'dark' | 'system'
    setThemeLocal(th)
    applyTheme(th)
  }

  const handleLanguageChange = (value: string) => {
    const lang = value as Language
    setLanguageLocal(lang)
    applyLanguage(lang)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#0F172A] dark:text-gray-100 mb-4">General Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.theme')}</label>
          <select className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2" value={theme} onChange={e => handleThemeChange(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.language')}</label>
          <select className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2" value={language} onChange={e => handleLanguageChange(e.target.value)}>
            {Object.entries(languageNames).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.timezone')}</label>
          <select className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2" value={timezone} onChange={e => setTimezone(e.target.value)}>
            {timezones.length > 0 ? timezones.map((tz: any) => (
              <option key={tz.name} value={tz.name}>{tz.name} ({tz.offset})</option>
            )) : (
              <>
                <option value="UTC">UTC</option>
                <option value="Asia/Kolkata">Asia/Kolkata (+05:30)</option>
                <option value="America/New_York">America/New_York (-05:00)</option>
                <option value="Europe/London">Europe/London (+00:00)</option>
              </>
            )}
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="font-semibold text-[#0F172A] dark:text-gray-100">Compact View</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Use compact layout for tables and lists</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={compactView} onChange={e => setCompactView(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-neon"></div>
          </label>
        </div>
      </div>

      <button
        onClick={() => onSave({ theme, language, timezone, compact_view: compactView })}
        disabled={saving}
        className="px-6 py-2 bg-accent-neon text-white rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

const NotificationSettings = ({ settings, onSave, saving }: { settings: any, onSave: (p: any) => void, saving: boolean }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings?.notifications?.notifications_enabled ?? true)
  const [emailNotifications, setEmailNotifications] = useState(settings?.notifications?.email_notifications ?? true)

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#0F172A] dark:text-gray-100 mb-4">Notification Preferences</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="font-semibold text-[#0F172A] dark:text-gray-100">Enable Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive in-app notifications for events</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={notificationsEnabled} onChange={e => setNotificationsEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-neon"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="font-semibold text-[#0F172A] dark:text-gray-100">Email Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates for important events</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-neon"></div>
          </label>
        </div>
      </div>

      <button
        onClick={() => onSave({ notifications_enabled: notificationsEnabled, email_notifications: emailNotifications })}
        disabled={saving}
        className="px-6 py-2 bg-accent-neon text-white rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  )
}

const SecuritySettings = ({ onChangePassword, saving }: { onChangePassword: (c: string, n: string) => void, saving: boolean }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    setError('')
    if (!currentPassword || !newPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    onChangePassword(currentPassword, newPassword)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#0F172A] dark:text-gray-100 mb-4">Change Password</h3>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm">{error}</div>
      )}

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2"
            placeholder="Enter current password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2"
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2"
            placeholder="Confirm new password"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="px-6 py-2 bg-accent-neon text-white rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Changing...' : 'Change Password'}
      </button>
    </div>
  )
}

export default Settings

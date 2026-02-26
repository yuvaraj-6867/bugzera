import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage, type Language } from '../../contexts/LanguageContext'
import BLoader from '../../components/BLoader'

const Settings = () => {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'notifications' | 'security' | 'audit_logs'>('profile')
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
      const res = await fetch('/api/settings', { headers })
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
      const res = await fetch('/api/settings', {
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
      const res = await fetch('/api/v1/auth/change_password', {
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
    { id: 'audit_logs' as const, labelKey: 'settings.auditLogs' },
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
            <BLoader />
          ) : (
            <>
              {activeTab === 'profile' && <ProfileSettings user={user} />}
              {activeTab === 'general' && <GeneralSettings settings={settings} onSave={saveSettings} saving={saving} />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'security' && <SecuritySettings onChangePassword={changePassword} saving={saving} />}
              {activeTab === 'audit_logs' && <AuditLogs />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const ProfileSettings = ({ user }: { user: any }) => {
  const [preview, setPreview] = useState<string | null>(user.avatar || null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setUploadMsg('Image must be less than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!preview) return
    setUploading(true)
    setUploadMsg('')
    try {
      const res = await fetch('/api/v1/profile/avatar', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatar: preview })
      })
      const data = await res.json()
      if (res.ok) {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        storedUser.avatar = preview
        localStorage.setItem('user', JSON.stringify(storedUser))
        setUploadMsg('Profile photo updated successfully!')
        setTimeout(() => setUploadMsg(''), 3000)
      } else {
        setUploadMsg(data.error || 'Upload failed')
      }
    } catch {
      setUploadMsg('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setUploading(true)
    setUploadMsg('')
    try {
      const res = await fetch('/api/v1/profile/avatar', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatar: null })
      })
      if (res.ok) {
        setPreview(null)
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        delete storedUser.avatar
        localStorage.setItem('user', JSON.stringify(storedUser))
        setUploadMsg('Profile photo removed.')
        setTimeout(() => setUploadMsg(''), 3000)
      }
    } catch {
      setUploadMsg('Failed to remove photo.')
    } finally {
      setUploading(false)
    }
  }

  const savedAvatar = user.avatar || null
  const hasNewPhoto = preview !== savedAvatar

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#0F172A] dark:text-gray-100 mb-4">Profile Information</h3>

      {uploadMsg && (
        <div className={`p-3 rounded-lg text-sm font-medium ${uploadMsg.includes('successfully') || uploadMsg.includes('removed') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {uploadMsg}
        </div>
      )}

      <div className="flex items-center gap-6 mb-6">
        {/* Avatar with upload overlay */}
        <div className="relative group flex-shrink-0">
          <div
            className="w-24 h-24 rounded-full overflow-hidden cursor-pointer ring-2 ring-transparent group-hover:ring-accent-neon transition-all"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-accent-neon/10 flex items-center justify-center text-3xl font-bold text-accent-neon">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
            )}
          </div>
          {/* Camera icon overlay on hover */}
          <div
            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
            onClick={() => fileRef.current?.click()}
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <div>
          <p className="text-xl font-semibold text-[#0F172A] dark:text-gray-100">{user.first_name} {user.last_name}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">{user.role}</span>

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-accent-neon hover:text-accent-electric font-medium"
            >
              {preview ? 'Change Photo' : 'Upload Photo'}
            </button>
            {preview && (
              <>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={handleRemove}
                  disabled={uploading}
                  className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG, GIF up to 2MB</p>
        </div>
      </div>

      {/* Save button — only shown when a new photo is selected but not yet saved */}
      {hasNewPhoto && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-5 py-2 bg-gradient-to-r from-accent-neon to-accent-electric text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Saving...' : 'Save Profile Photo'}
        </button>
      )}

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

const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: (v: boolean) => void, disabled?: boolean }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} className="sr-only peer" />
    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-neon peer-disabled:opacity-40"></div>
  </label>
)

const NotificationSettings = () => {
  const token = localStorage.getItem('authToken')
  const hdrs = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  const [prefs, setPrefs] = useState<any>(null)
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/v1/notifications/preferences', { headers: hdrs })
      .then(r => r.json())
      .then(data => { setPrefs(data); setLoadingPrefs(false) })
      .catch(() => setLoadingPrefs(false))
  }, [])

  const set = (key: string, value: any) => setPrefs((p: any) => ({ ...p, [key]: value }))

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/v1/notifications/preferences', {
        method: 'PUT', headers: hdrs, body: JSON.stringify(prefs)
      })
      const data = await res.json()
      if (res.ok) { setPrefs(data); setMessage('Preferences saved successfully'); setTimeout(() => setMessage(''), 3000) }
      else setMessage(data.error || 'Failed to save')
    } catch { setMessage('Failed to save') }
    finally { setSaving(false) }
  }

  if (loadingPrefs) return <BLoader />

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-[#0F172A] dark:text-gray-100">Notification Preferences</h3>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message}
        </div>
      )}

      {/* In-App */}
      <div>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-3">
          <div>
            <p className="font-semibold text-[#0F172A] dark:text-gray-100">In-App Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Show notifications inside the platform</p>
          </div>
          <Toggle checked={prefs?.inapp_enabled ?? true} onChange={v => set('inapp_enabled', v)} />
        </div>
        <div className="ml-4 pl-4 border-l-2 border-gray-100 dark:border-gray-700 space-y-2">
          {[
            { key: 'inapp_test_runs',   label: 'Test Runs',   desc: 'Test run started, completed or failed' },
            { key: 'inapp_tickets',     label: 'Tickets',     desc: 'Ticket created, updated or resolved' },
            { key: 'inapp_mentions',    label: 'Mentions',    desc: 'When someone mentions you' },
            { key: 'inapp_assignments', label: 'Assignments', desc: 'When items are assigned to you' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-gray-100">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <Toggle checked={prefs?.[key] ?? true} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Email */}
      <div>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-3">
          <div>
            <p className="font-semibold text-[#0F172A] dark:text-gray-100">Email Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates for important events</p>
          </div>
          <Toggle checked={prefs?.email_enabled ?? true} onChange={v => set('email_enabled', v)} />
        </div>
        <div className="ml-4 pl-4 border-l-2 border-gray-100 dark:border-gray-700 space-y-2">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
            <label className="block text-sm font-medium text-[#0F172A] dark:text-gray-100 mb-1">Digest Frequency</label>
            <select
              value={prefs?.email_digest_mode || 'immediate'}
              onChange={e => set('email_digest_mode', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Digest</option>
            </select>
          </div>
          {[
            { key: 'email_test_runs',   label: 'Test Runs',   desc: 'Email on test run completion' },
            { key: 'email_tickets',     label: 'Tickets',     desc: 'Email on ticket updates' },
            { key: 'email_mentions',    label: 'Mentions',    desc: 'Email when mentioned' },
            { key: 'email_assignments', label: 'Assignments', desc: 'Email on new assignments' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-gray-100">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <Toggle checked={prefs?.[key] ?? true} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Do Not Disturb */}
      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="font-semibold text-[#0F172A] dark:text-gray-100 mb-1">Do Not Disturb</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Mute all notifications during these hours</p>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
            <input
              type="time"
              value={prefs?.do_not_disturb_start || ''}
              onChange={e => set('do_not_disturb_start', e.target.value || null)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <span className="text-gray-400 pb-2">to</span>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
            <input
              type="time"
              value={prefs?.do_not_disturb_end || ''}
              onChange={e => set('do_not_disturb_end', e.target.value || null)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {(prefs?.do_not_disturb_start || prefs?.do_not_disturb_end) && (
            <button
              onClick={() => { set('do_not_disturb_start', null); set('do_not_disturb_end', null) }}
              className="pb-2 text-xs text-red-500 hover:text-red-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="px-6 py-2 bg-accent-neon text-white rounded-lg hover:opacity-90 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  )
}

const TwoFactorAuth = () => {
  const hdrs = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' }
  const [status, setStatus]     = useState<boolean | null>(null)
  const [setupData, setSetupData] = useState<any>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [disableCode, setDisableCode] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/v1/totp/status', { headers: hdrs })
      .then(r => r.json()).then(d => setStatus(d.enabled)).catch(() => setStatus(false))
  }, [])

  const startSetup = async () => {
    setBusy(true)
    const res = await fetch('/api/v1/totp/setup', { headers: hdrs })
    const d = await res.json()
    setSetupData(d)
    setBusy(false)
  }

  const handleEnable = async () => {
    if (!verifyCode.trim()) return
    setBusy(true)
    const res = await fetch('/api/v1/totp/enable', { method: 'POST', headers: hdrs, body: JSON.stringify({ code: verifyCode }) })
    const d = await res.json()
    if (res.ok) { setStatus(true); setBackupCodes(d.backup_codes || []); setSetupData(null); setMsg('2FA enabled successfully!') }
    else setMsg(d.error || 'Invalid code')
    setBusy(false)
  }

  const handleDisable = async () => {
    if (!disableCode.trim()) return
    setBusy(true)
    const res = await fetch('/api/v1/totp/disable', { method: 'POST', headers: hdrs, body: JSON.stringify({ code: disableCode }) })
    const d = await res.json()
    if (res.ok) { setStatus(false); setDisableCode(''); setMsg('2FA disabled.') }
    else setMsg(d.error || 'Invalid code')
    setBusy(false)
  }

  if (status === null) return <div className="text-gray-400 text-sm py-4">Loading 2FA status...</div>

  return (
    <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold text-[#0F172A] dark:text-gray-100">Two-Factor Authentication</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">Protect your account with an authenticator app (Google Authenticator, Authy, etc.)</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {status ? '✓ Enabled' : 'Disabled'}
        </span>
      </div>

      {msg && <div className={`p-3 rounded-lg text-sm mb-4 ${msg.includes('success') || msg.includes('enabled') || msg.includes('disabled') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{msg}</div>}

      {backupCodes.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg mb-4">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Save your backup codes — shown only once!</p>
          <div className="grid grid-cols-4 gap-2">
            {backupCodes.map(c => <code key={c} className="bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-600 rounded px-2 py-1 text-xs font-mono">{c}</code>)}
          </div>
          <button onClick={() => setBackupCodes([])} className="mt-3 text-xs text-yellow-700 underline">I've saved these codes</button>
        </div>
      )}

      {!status && !setupData && backupCodes.length === 0 && (
        <button onClick={startSetup} disabled={busy} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">
          {busy ? 'Loading...' : 'Set Up 2FA'}
        </button>
      )}

      {setupData && (
        <div className="space-y-4 max-w-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400">1. Scan this QR code with your authenticator app:</p>
          <img src={setupData.qr_url} alt="QR Code" className="w-48 h-48 border border-gray-200 dark:border-gray-600 rounded-lg bg-white p-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Or enter this key manually:</p>
          <code className="block bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 text-sm font-mono tracking-widest break-all">{setupData.secret}</code>
          <p className="text-sm text-gray-600 dark:text-gray-400">2. Enter the 6-digit code from the app to verify:</p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-lg font-mono tracking-widest w-36 text-center"
              placeholder="000000"
            />
            <button onClick={handleEnable} disabled={busy || verifyCode.length !== 6} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
              {busy ? 'Verifying...' : 'Activate 2FA'}
            </button>
            <button onClick={() => setSetupData(null)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {status && (
        <div className="space-y-3 max-w-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400">Enter your authenticator code to disable 2FA:</p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={disableCode}
              onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-lg font-mono tracking-widest w-36 text-center"
              placeholder="000000"
            />
            <button onClick={handleDisable} disabled={busy || disableCode.length !== 6} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">
              {busy ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}
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

      <TwoFactorAuth />
    </div>
  )
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1 })
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }

  useEffect(() => {
    setLoading(true)
    fetch(`/api/v1/audit_logs?page=${page}&per_page=20`, { headers })
      .then(async res => {
        if (res.ok) { const d = await res.json(); setLogs(d.audit_logs || []); setMeta(d.meta || { total: 0, pages: 1 }) }
      })
      .finally(() => setLoading(false))
  }, [page])

  const actionColor: Record<string, string> = {
    login: 'bg-green-100 text-green-700',
    logout: 'bg-gray-100 text-gray-700',
    create: 'bg-blue-100 text-blue-700',
    update: 'bg-yellow-100 text-yellow-700',
    delete: 'bg-red-100 text-red-700',
    access_denied: 'bg-orange-100 text-orange-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#0F172A] dark:text-gray-100">Audit Logs</h3>
        <span className="text-sm text-gray-400">{meta.total} total events</span>
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>No audit log entries found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3 flex items-center gap-4">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${actionColor[log.action] || 'bg-gray-100 text-gray-600'}`}>
                {log.action}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{log.user_name || 'System'}</span>
                <span className="text-sm text-gray-500 mx-1">·</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}</span>
                {log.details && <p className="text-xs text-gray-400 mt-0.5 truncate">{log.details}</p>}
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                <div>{log.ip_address || ''}</div>
                <div>{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {meta.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline py-1 px-3 text-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-500">Page {page} / {meta.pages}</span>
          <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page === meta.pages} className="btn btn-outline py-1 px-3 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}

export default Settings

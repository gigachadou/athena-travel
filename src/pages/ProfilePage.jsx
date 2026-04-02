import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings as SettingsIcon, Bell, Shield, LogOut, Trash2, ChevronRight, Camera, X, Check, Moon, Sun, Globe, Ticket as TicketIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '../styles/ProfilePage.css'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'

const ProfilePage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const { user, profile, saveProfile, logout } = useAuth()
  const [userData, setUserData] = useState({
    username: '',
    name: '',
    email: '',
    avatar: null,
  })

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('afina_settings')
    return saved ? JSON.parse(saved) : {
      notifications: true,
      darkMode: false,
      language: i18n.language || 'uz'
    }
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(userData)
  const [activeTab, setActiveTab] = useState('main') // 'main', 'settings', 'security'

  useEffect(() => {
    localStorage.setItem('afina_settings', JSON.stringify(settings))
    // Apply theme globally
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
  }, [settings])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setProfileLoading(false)
        return
      }

      setProfileLoading(true)
      setProfileError('')

      try {
        const nextUserData = {
          username: profile?.username || user.username || '',
          name: profile?.full_name || user.fullName || 'Foydalanuvchi',
          email: profile?.email || user.email || '',
          avatar: profile?.avatar_url || user.avatarUrl || null,
        }

        setUserData(nextUserData)
        setEditForm(nextUserData)
      } catch (error) {
        console.error('Failed to load profile:', error)
        setProfileError("Profil ma'lumotlarini yuklab bo'lmadi.")
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [user?.id, profile?.username, profile?.full_name, profile?.email, profile?.avatar_url])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to sign out:', error)
    } finally {
      navigate('/login')
    }
  }

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await saveProfile({
        username: editForm.username,
        full_name: editForm.name,
        avatar_url: editForm.avatar,
      })

      const nextUserData = {
        ...editForm,
        name: updatedProfile.full_name || editForm.name,
        email: updatedProfile.email || editForm.email,
        avatar: updatedProfile.avatar_url || editForm.avatar,
      }

      setUserData(nextUserData)
      setEditForm(nextUserData)
      setIsEditing(false)
      setProfileError('')
    } catch (error) {
      console.error('Failed to update profile:', error)
      setProfileError("Profilni saqlab bo'lmadi.")
    }
  }

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    setSettings(prev => ({ ...prev, language: lng }))
  }

  const renderEditModal = () => (
    <div className="modal-overlay glass-full fade-in">
      <div className="edit-modal glass animate-up">
        <div className="modal-header">
          <h3>{t('edit_profile')}</h3>
          <button className="btn-close" onClick={() => setIsEditing(false)}><X size={24} /></button>
        </div>
        <div className="modal-body">
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={editForm.username}
              onChange={e => setEditForm({...editForm, username: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label>{t('name')}</label>
            <input 
              type="text" 
              value={editForm.name} 
              onChange={e => setEditForm({...editForm, name: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="text" value={editForm.email} disabled />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-save btn-primary" onClick={handleSaveProfile}>
            <Check size={18} /> {t('save')}
          </button>
        </div>
      </div>
    </div>
  )

  const renderSecurityView = () => (
    <div className="sub-view animate-up">
        <div className="sub-header">
            <button className="btn-back" onClick={() => setActiveTab('main')}>
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <h3>{t('security')}</h3>
        </div>
        <div className="settings-list">
            <div className="security-item glass">
                <div className="item-text">
                    <h4>Parolni o'zgartirish</h4>
                    <p>Oxirgi marta 3 oy oldin o'zgartirilgan</p>
                </div>
                <button className="btn-outline">O'zgartirish</button>
            </div>
            <div className="security-item glass">
                <div className="item-text">
                    <h4>2-bosqichli tekshiruv</h4>
                    <p>Hisobingizni xavfsizroq qiling</p>
                </div>
                <div className="toggle-switch">
                    <input type="checkbox" id="2fa" />
                    <label htmlFor="2fa"></label>
                </div>
            </div>
        </div>
    </div>
  )

  const renderSettingsView = () => (
    <div className="sub-view animate-up">
        <div className="sub-header">
            <button className="btn-back" onClick={() => setActiveTab('main')}>
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <h3>{t('settings')}</h3>
        </div>
        <div className="settings-list">
          <div className="setting-control glass">
            <div className="control-info">
              <Bell size={20} />
              <span>{t('notifications')}</span>
            </div>
            <div className="toggle-switch">
              <input 
                type="checkbox" 
                id="notif-toggle" 
                checked={settings.notifications}
                onChange={() => toggleSetting('notifications')}
              />
              <label htmlFor="notif-toggle"></label>
            </div>
          </div>

          <div className="setting-control glass">
            <div className="control-info">
              {settings.darkMode ? <Moon size={20} /> : <Sun size={20} />}
              <span>{t('dark_mode')}</span>
            </div>
            <div className="toggle-switch">
              <input 
                type="checkbox" 
                id="theme-toggle" 
                checked={settings.darkMode}
                onChange={() => toggleSetting('darkMode')}
              />
              <label htmlFor="theme-toggle"></label>
            </div>
          </div>

          <div className="setting-control glass">
            <div className="control-info">
              <Globe size={20} />
              <span>{t('language')}</span>
            </div>
            <select 
                className="lang-select" 
                value={settings.language} 
                onChange={(e) => changeLanguage(e.target.value)}
            >
              <option value="uz">O'zbek</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
    </div>
  )

  if (activeTab === 'settings') return renderSettingsView()
  if (activeTab === 'security') return renderSecurityView()
  if (profileLoading) return <Loading fullPage message={t('loading')} />

  return (
    <div className="profile-page fade-in">
      {isEditing && renderEditModal()}
      {profileError && <p style={{ color: '#d14343', marginBottom: '16px' }}>{profileError}</p>}
      
      <div className="profile-card glass">
        <div className="avatar-wrapper">
          <div className="avatar">
            {userData.avatar ? <img src={userData.avatar} alt="Avatar" /> : <User size={50} />}
            <button className="btn-camera">
              <Camera size={16} />
            </button>
          </div>
        </div>
        <h2 className="user-name">{userData.name}</h2>
        <p className="user-phone">@{userData.username}</p>
        <p className="user-phone">{userData.email}</p>
        
        <button className="btn-edit-inline" onClick={() => { setEditForm(userData); setIsEditing(true); }}>
            {t('edit_profile')}
        </button>
      </div>

      <div className="settings-list">
        <div className="setting-item glass" onClick={() => navigate('/tickets')}>
          <div className="setting-icon" style={{ background: 'rgba(255, 184, 0, 0.1)', color: 'var(--accent-gold)' }}>
            <TicketIcon size={20} />
          </div>
          <div className="setting-info">
            <h4>Mening chiptalarim</h4>
            <p>Barcha faol va yakunlangan buyurtmalar</p>
          </div>
          <ChevronRight size={18} className="chevron" />
        </div>
        <div className="setting-item glass" onClick={() => setActiveTab('settings')}>
          <div className="setting-icon"><SettingsIcon size={20} /></div>
          <div className="setting-info">
            <h4>{t('settings')}</h4>
            <p>Profil va bildirishnomalar</p>
          </div>
          <ChevronRight size={18} className="chevron" />
        </div>
        <div className="setting-item glass" onClick={() => setActiveTab('security')}>
          <div className="setting-icon"><Shield size={20} /></div>
          <div className="setting-info">
            <h4>{t('security')}</h4>
            <p>Xavfsizlik va parollar</p>
          </div>
          <ChevronRight size={18} className="chevron" />
        </div>
      </div>

      <div className="danger-zone">
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>{t('logout')}</span>
        </button>
        <button className="btn-delete">
          <Trash2 size={20} />
          <span>{t('delete_account')}</span>
        </button>
      </div>
    </div>
  )
}

export default ProfilePage

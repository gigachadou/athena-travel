import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, Settings as SettingsIcon, Shield, LogOut, Camera, X, Check, 
  Moon, Sun, Ticket as TicketIcon, Heart, Plane, Train, Clock, 
  MapPin, ArrowRight, Activity, Truck, ChevronLeft, Building, Coffee, Globe, Info, Sparkles
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '../styles/ProfilePage.css'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import { fetchUserFavorites } from '../services/databaseService'

const ProfilePage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, profile, saveProfile, logout } = useAuth()
  
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('main') // main, settings, saved, transit
  
  const [userData, setUserData] = useState({
    username: '',
    name: '',
    email: '',
    avatar: null,
  })
  
  const [editForm, setEditForm] = useState(userData)
  const [savedItems, setSavedItems] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  
  // Real stats state
  const [userTickets, setUserTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)

  const [transitSchedules, setTransitSchedules] = useState({
    surkhandarya: [],
    uzbekistan: [],
    international: []
  })
  const [loadingTransit, setLoadingTransit] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setProfileLoading(false)
        return
      }
      setProfileLoading(true)
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
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [user?.id, profile])

  useEffect(() => {
    if (activeTab === 'saved' && user?.id) {
      const loadSaved = async () => {
        setLoadingSaved(true)
        try {
          const items = await fetchUserFavorites(user.id)
          setSavedItems(items)
        } catch (error) {
          console.error('Failed to load favorites:', error)
          setProfileError("Yoqtirganlarni yuklashda xatolik yuz berdi.")
        } finally {
          setLoadingSaved(false)
        }
      }
      loadSaved()
    }
    
    if (activeTab === 'transit') {
      const loadTransit = async () => {
        setLoadingTransit(true)
        try {
          const { fetchTransitSchedules } = await import('../services/databaseService')
          const data = await fetchTransitSchedules()
          
          const categorized = {
             surkhandarya: data.filter(d => d.category === 'surkhandarya'),
             uzbekistan: data.filter(d => d.category === 'uzbekistan'),
             international: data.filter(d => d.category === 'international')
          }
          setTransitSchedules(categorized)
        } catch (error) {
          console.error('Failed to load transit data:', error)
        } finally {
          setLoadingTransit(false)
        }
      }
      loadTransit()
    }
  }, [activeTab, user?.id])

  useEffect(() => {
    if (user?.id) {
      const loadTickets = async () => {
        setLoadingTickets(true)
        try {
          const { fetchUserTickets } = await import('../services/databaseService')
          const tickets = await fetchUserTickets(user.id)
          setUserTickets(tickets || [])
        } catch (error) {
          console.error('Failed to load tickets count:', error)
          setUserTickets([])
        } finally {
          setLoadingTickets(false)
        }
      }
      loadTickets()
    }
  }, [user?.id])

  const handleSaveProfile = async () => {
    setProfileLoading(true)
    try {
      const updated = await saveProfile({
        username: editForm.username,
        full_name: editForm.name,
      })
      setUserData({
        ...userData,
        username: updated.username,
        name: updated.full_name
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Profile update error:', error)
      setProfileError("Profilni saqlashda xatolik: " + (error.message || "noma'lum xato"))
    } finally {
      setProfileLoading(false)
    }
  }

  const renderSavedView = () => (
    <div className="sub-view fade-in">
      <div className="sub-header-premium">
        <button className="btn-back-square" onClick={() => setActiveTab('main')}>
          <ChevronLeft size={22} />
        </button>
        <div className="tab-title">
           <h3>Yoqtirganlarim</h3>
           <p>{savedItems.length} ta saqlangan maskan</p>
        </div>
      </div>
      
      {loadingSaved ? <Loading /> : (
        <div className="saved-list-full">
          {savedItems.length > 0 ? savedItems.map((item, idx) => (
            <div key={item.id} className="place-item-card glass animate-up" style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => navigate(`/place/${item.id}`)}>
              <div className="place-image">
                <img src={item.image} alt={item.title} />
                <div className="place-rating"><Heart size={12} fill="white" /></div>
              </div>
              <div className="place-info">
                <h4>{item.title}</h4>
                <div className="place-row"><MapPin size={14} /> <span>{item.location}</span></div>
                <div className="place-row"><Coffee size={14} /> <span>{item.type || 'Sayohat'}</span></div>
                <div className="place-footer">
                   <span className="place-price">{item.price}</span>
                   <button className="btn-go"><ArrowRight size={16} /></button>
                </div>
              </div>
            </div>
          )) : (
            <div className="empty-state-premium">
              <div className="empty-gfx"><Heart size={48} /></div>
              <h4>Hali hech narsa yo'q</h4>
              <p>Maftunkor joylarni qidiring va ularni sevimli qiling.</p>
              <button className="btn-primary-glow" onClick={() => navigate('/')}>Maskanlarni ko'rish</button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderTransitView = () => (
    <div className="sub-view transit-dashboard fade-in">
      <div className="sub-header-premium">
        <button className="btn-back-square" onClick={() => setActiveTab('main')}>
          <ChevronLeft size={22} />
        </button>
        <div className="tab-title">
           <h3>Transport Tablosu</h3>
           <div className="live-clock">
              <Activity size={14} className="pulse" />
              <span>LIVE - Barcha qatnovlar</span>
           </div>
        </div>
      </div>

      {loadingTransit ? <Loading message="Reyslar yuklanmoqda..." /> : (
        <div className="board-container">
          {/* SURKHANDARYA BOARD */}
          <div className="digital-board surkhan">
            <div className="board-header">
              <Building size={20} />
              <span>Surxondaryo reyslari (Termiz / Denov / Sariosiyo)</span>
            </div>
            <div className="board-table-scroll">
              <table className="terminal-table">
                <thead>
                  <tr>
                    <th>Tur</th>
                    <th>Nomer</th>
                    <th>Yo'nalish</th>
                    <th>Vaqt</th>
                    <th>Pl/Gate</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {transitSchedules.surkhandarya.map(t => (
                    <tr key={t.id}>
                      <td className="type-col">{t.type}</td>
                      <td className="code-col">{t.number}</td>
                      <td className="route-col">{t.route}</td>
                      <td className="time-col">{t.depart_time}</td>
                      <td className="plat-col">{t.platform}</td>
                      <td><span className={`status-tag ${t.status?.toLowerCase().replace(' ', '-')}`}>{t.status}</span></td>
                    </tr>
                  ))}
                  {transitSchedules.surkhandarya.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>Reyslar topilmadi</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* UZBEKISTAN BOARD */}
          <div className="digital-board">
            <div className="board-header">
              <Globe size={20} />
              <span>Respublika bo'ylab qatnovlar</span>
            </div>
            <div className="board-table-scroll">
              <table className="terminal-table">
                <thead>
                  <tr>
                    <th>Nomi</th>
                    <th>Reys</th>
                    <th>Yo'nalish</th>
                    <th>Vaqt</th>
                    <th>Pl/Gate</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {transitSchedules.uzbekistan.map(t => (
                    <tr key={t.id}>
                      <td className="type-col">{t.type}</td>
                      <td className="code-col">{t.number}</td>
                      <td className="route-col">{t.route}</td>
                      <td className="time-col">{t.depart_time}</td>
                      <td className="plat-col">{t.platform}</td>
                      <td><span className={`status-tag ${t.status?.toLowerCase().replace(' ', '-')}`}>{t.status}</span></td>
                    </tr>
                  ))}
                  {transitSchedules.uzbekistan.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>Reyslar topilmadi</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* INTERNATIONAL BOARD */}
          <div className="digital-board airline">
            <div className="board-header">
              <Plane size={20} />
              <span>Xalqaro Aviaparvozlar</span>
            </div>
            <div className="board-table-scroll">
              <table className="terminal-table">
                <thead>
                  <tr>
                    <th>Reys</th>
                    <th>Yo'nalish</th>
                    <th>Vaqt</th>
                    <th>Gate</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {transitSchedules.international.map(f => (
                    <tr key={f.id}>
                      <td className="code-col">{f.number}</td>
                      <td className="route-col">{f.route}</td>
                      <td className="time-col">{f.depart_time}</td>
                      <td className="plat-col">{f.platform}</td>
                      <td><span className={`status-tag ${f.status?.toLowerCase().replace(' ', '-')}`}>{f.status}</span></td>
                    </tr>
                  ))}
                  {transitSchedules.international.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>Reyslar topilmadi</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderSecurityView = () => (
    <div className="sub-view fade-in">
        <div className="sub-header-premium">
            <button className="btn-back-square" onClick={() => setActiveTab('main')}>
                <ChevronLeft size={22} />
            </button>
            <h3>Xavfsizlik</h3>
        </div>
        <div className="settings-stack">
            <div className="security-card glass">
                <div className="card-top">
                    <Shield size={24} color="var(--accent-gold)" />
                    <h4>Hisobni himoyalash</h4>
                </div>
                <div className="card-action">
                    <p>Parolni muntazam yangilab turing</p>
                    <button className="btn-outline-gold">Yangilash</button>
                </div>
            </div>
            <div className="info-card glass">
               <Info size={20} color="var(--accent-gold)" />
               <p>Sizning ma'lumotlaringiz shifrlangan va xavfsiz saqlanadi.</p>
            </div>
        </div>
    </div>
  )

  if (activeTab === 'saved') return renderSavedView()
  if (activeTab === 'transit') return renderTransitView()
  if (activeTab === 'security') return renderSecurityView()

  if (profileLoading) return <Loading fullPage message={t('loading')} />

  return (
    <div className="profile-page-premium fade-in">
      {profileError && (
        <div className="error-toast glass">
           <Info size={20} color="#ef4444" />
           <span>{profileError}</span>
           <button onClick={() => setProfileError('')}><X size={16} /></button>
        </div>
      )}

      {/* ─── Premium Profile Edit Modal ────────────────────────────────────── */}
      {isEditing && (
        <div className="modal-overlay glass-full fade-in" onClick={() => setIsEditing(false)}>
          <div className="edit-modal-premium glass-full animate-up" onClick={e => e.stopPropagation()}>
            <div className="modal-inner">
               <div className="modal-header-premium">
                  <div className="icon-wrap-gold">
                    <User size={24} />
                  </div>
                  <div className="texts">
                    <h3>Profilni tahrirlash</h3>
                    <p className="muted">Shaxsiy ma'lumotlaringizni yangilang</p>
                  </div>
                  <button className="btn-close-modal" onClick={() => setIsEditing(false)}>
                    <ChevronLeft size={20} />
                  </button>
               </div>

               <div className="edit-form-pro">
                  <div className="input-group-pro">
                    <label>Ism va Familiya</label>
                    <div className="input-with-icon-pro">
                      <User size={18} />
                      <input 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        placeholder="Toliq ism"
                      />
                    </div>
                  </div>

                  <div className="input-group-pro">
                    <label>Username</label>
                    <div className="input-with-icon-pro">
                      <Globe size={18} />
                      <input 
                        value={editForm.username} 
                        onChange={e => setEditForm({...editForm, username: e.target.value})}
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  <div className="input-group-pro">
                    <label>Profil rasmi URL (Avatar)</label>
                    <div className="input-with-icon-pro">
                      <Camera size={18} />
                      <input 
                        value={editForm.avatar || ''} 
                        onChange={e => setEditForm({...editForm, avatar: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="modal-actions-pro">
                    <button className="btn-cancel-pro" onClick={() => setIsEditing(false)}>
                      Bekor qilish
                    </button>
                    <button 
                      className="btn-save-pro" 
                      onClick={handleSaveProfile}
                      disabled={profileLoading}
                    >
                      {profileLoading ? <div className="spinner-small" /> : 'Saqlash'}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PROFILE HEADER */}
      <div className="profile-hero glass animate-up">
        <div className="profile-top">
            <div className="profile-avatar-wrap">
                <div className="avatar-main">
                    {userData.avatar ? <img src={userData.avatar} alt="Avatar" /> : <User size={44} />}
                    <button className="avatar-edit"><Camera size={14} /></button>
                </div>
            </div>
            <div className="profile-meta">
                <h2>{userData.name}</h2>
                <p>@{userData.username}</p>
            </div>
            <button className="btn-settings-icon" onClick={() => setActiveTab('security')}><SettingsIcon size={20} /></button>
        </div>
        
        <div className="profile-stats">
            <div className="stat-item" onClick={() => setActiveTab('saved')}>
                <strong>{savedItems.length}</strong>
                <span>Sevimli</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item" onClick={() => navigate('/tickets')}>
                <strong>{userTickets.length}</strong>
                <span>Chiptalar</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
                <strong>{savedItems.length + userTickets.length}</strong>
                <span>Faollik</span>
            </div>
        </div>
      </div>

      {/* QUICK MENU */}
      <div className="menu-grid animate-up" style={{ animationDelay: '0.1s' }}>
        <div className="menu-card glass gold" onClick={() => navigate('/tickets')}>
            <TicketIcon size={28} />
            <div className="menu-text">
                <h4>Chiptalar</h4>
                <p>Mening buyurtmalarim</p>
            </div>
        </div>
        <div className="menu-card glass red" onClick={() => setActiveTab('saved')}>
            <Heart size={28} />
            <div className="menu-text">
                <h4>Saqlanganlar</h4>
                <p>Yoqtirgan maskanlar</p>
            </div>
        </div>
        <div className="menu-card glass blue" onClick={() => setActiveTab('transit')}>
            <Activity size={28} />
            <div className="menu-text">
                <h4>Transport</h4>
                <p>Jonli qatnov jadvali</p>
            </div>
        </div>
        <div className="menu-card glass teal" onClick={() => navigate('/guides')}>
            <Sparkles size={28} />
            <div className="menu-text">
                <h4>Gid yollash</h4>
                <p>Tajribali gid tanlash</p>
            </div>
        </div>
        <div className="menu-card glass purple" onClick={() => navigate('/transport-services')}>
            <Truck size={28} />
            <div className="menu-text">
                <h4>Transport xizmati</h4>
                <p>Haydovchi va transfer</p>
            </div>
        </div>
        <div className="menu-card glass green" onClick={() => setIsEditing(true)}>
            <User size={28} />
            <div className="menu-text">
                <h4>Tahrirlash</h4>
                <p>Profil ma'lumotlari</p>
            </div>
        </div>
      </div>

      <div className="profile-footer animate-up" style={{ animationDelay: '0.2s' }}>
        <button className="btn-logout-premium" onClick={async () => { await logout(); navigate('/login'); }}>
          <LogOut size={20} />
          <span>Tizimdan chiqish</span>
        </button>
      </div>
    </div>
  )
}

export default ProfilePage

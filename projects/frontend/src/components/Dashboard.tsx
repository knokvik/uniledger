import React, { useState, useEffect, useRef } from "react"
import { useWallet, WalletId } from "@txnlab/use-wallet-react"
import { useAuth } from "../hooks/useAuth"
import { useDashboardData } from "../hooks/useDashboard"
import { useChannels } from "../hooks/useChannels"
import { useManageChannels } from "../hooks/useManageChannels"
import { useMessages } from "../hooks/useMessages"
import ThreeDotLoader from "./ThreeDotLoader"
import CreateEntityModal from "./CreateEntityModal"
import EditEntityModal from "./EditEntityModal"
import SearchModal from "./SearchModal"
import ProfileSettingsModal from "./ProfileSettingsModal"
import NotificationBell from "./NotificationBell"

const Dashboard = () => {
  const { activeAddress, wallets } = useWallet()
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState<'club' | 'event'>('club')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false)

  const openCreateModal = (type: 'club' | 'event') => {
    setCreateType(type)
    setShowCreateModal(true)
  }

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editType, setEditType] = useState<'club' | 'event'>('club')
  const [editEntity, setEditEntity] = useState<any>(null)

  const openEditModal = (entity: any, type: 'club' | 'event') => {
    setEditEntity(entity)
    setEditType(type)
    setShowEditModal(true)
  }

  const { createChannel, deleteChannel } = useManageChannels()

  // Message Logic
  const { messages, isLoading: isMessagesLoading, sendMessage, error: messagesError } = useMessages(selectedChannel)
  const [messagesInput, setMessagesInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!messagesInput.trim() || !selectedChannel) return
    try {
      await sendMessage.mutateAsync({ channelId: selectedChannel, content: messagesInput })
      setMessagesInput('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateChannel = async () => {
    const isClub = activeSection.startsWith('club-')
    const type = isClub ? 'club' : 'event'
    const id = activeSection.replace(isClub ? 'club-' : 'event-', '')

    // Check if valid context
    if (!id) return

    const name = window.prompt("Enter channel name:")
    if (!name) return

    const visibility = window.prompt("Visibility (public, volunteer, owner):", "public")
    if (!visibility) return

    try {
      await createChannel.mutateAsync({
        name,
        description: '',
        visibility,
        type,
        type_id: id
      })
    } catch (error) {
      console.error("Failed to create channel:", error)
      alert("Failed to create channel")
    }
  }

  const handleDeleteChannel = async (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation()
    if (!window.confirm("Are you sure you want to delete this channel?")) return

    try {
      await deleteChannel.mutateAsync(channelId)
    } catch (error) {
      console.error("Failed to delete channel:", error)
      alert("Failed to delete channel")
    }
  }

  // Fetch dashboard data (clubs and events)
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboardData()

  // Determine current club/event type and ID
  const currentType = activeSection.startsWith('club-') ? 'club' : activeSection.startsWith('event-') ? 'event' : null
  const currentId = activeSection.startsWith('club-')
    ? activeSection.replace('club-', '')
    : activeSection.startsWith('event-')
      ? activeSection.replace('event-', '')
      : null

  // Fetch channels for the current club/event
  const { data: channels, isLoading: isChannelsLoading } = useChannels(currentType, currentId)

  // Determine if user can view treasury based on their memberships
  const clubs = dashboardData?.clubs || []
  const events = dashboardData?.events || []
  const isOwner = clubs.length > 0 || events.length > 0

  // User should see treasury only if they own clubs or events
  const canViewTreasury = isOwner

  // Log dashboard data when it loads
  useEffect(() => {
    if (dashboardData && !isDashboardLoading) {
      console.log('=== DASHBOARD DATA LOADED ===')
      console.log('Total Clubs Owned:', clubs.length)
      console.log('Total Events Owned:', events.length)
      console.log('Is Owner:', isOwner)
      console.log('Can View Treasury:', canViewTreasury)
      console.log('Full Dashboard Data:', dashboardData)
      console.log('============================')
    }
  }, [dashboardData, isDashboardLoading])

  // Auto-select first channel when channels are loaded
  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannel) {
      const firstChannel = channels[0]
      setSelectedChannel(firstChannel.id)
    }
  }, [channels, selectedChannel])

  const connectLocalnet = async () => {
    try {
      setLoading(true)
      const localnetWallet = wallets.find((w) => w.id === WalletId.KMD)
      if (localnetWallet) {
        await localnetWallet.connect()
      }
    } catch (error) {
      console.error("Failed to connect to Localnet:", error)
    } finally {
      setLoading(false)
    }
  }

  const connectPera = async () => {
    try {
      // Don't show loading overlay for Pera - it has its own QR modal
      const peraWallet = wallets.find((w) => w.id === WalletId.PERA)
      if (peraWallet) {
        await peraWallet.connect()
      }
    } catch (error) {
      console.error("Failed to connect to Pera:", error)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Fixed, no scroll */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="text-xl font-bold text-gray-800">UniLedger</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Dashboard Button */}
          <div className="mb-6">
            <button
              onClick={() => {
                setActiveSection("dashboard")
                setSelectedChannel(null) // Reset channel when going to dashboard
                console.log('Navigating to Dashboard')
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeSection === "dashboard"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <span className="text-lg">📊</span>
              <span className="font-medium">Dashboard</span>
            </button>
          </div>

          {/* Loading State */}
          {isDashboardLoading && (
            <div className="flex items-center justify-center py-8">
              <ThreeDotLoader />
            </div>
          )}

          {/* My Clubs Section */}
          {!isDashboardLoading && (
            <div className="mb-6">
              <div className="flex items-center justify-between px-4 mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  My Clubs {clubs.length > 0 && `(${clubs.length})`}
                </p>
                <button
                  onClick={() => openCreateModal('club')}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition"
                  title="Create New Club"
                >
                  <span className="text-xl leading-none pb-1">+</span>
                </button>
              </div>
              {clubs.length > 0 ? (
                <div className="space-y-1">
                  {clubs.map((club: any) => {
                    // Log club data to console
                    console.log('Club:', {
                      id: club.id,
                      name: club.name,
                      banner_url: club.banner_url,
                      user_role: club.user_role,
                      member_count: club.member_count,
                      channel_count: club.channel_count,
                      created_at: club.created_at
                    })

                    return (
                      <button
                        key={club.id}
                        onClick={() => {
                          setActiveSection(`club-${club.id}`)
                          setSelectedChannel(null) // Reset, will be set by useEffect
                          console.log('Clicked club:', club.id, club.name)
                          console.log('User role:', club.user_role)
                          console.log('Total channels:', club.channel_count)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${activeSection === `club-${club.id}`
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {club.banner_url ? (
                          <img src={club.banner_url} alt={club.name} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded flex items-center justify-center text-white text-sm font-bold">
                            {club.name[0]}
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium truncate">{club.name}</p>
                          <p className="text-xs text-gray-500">Owner</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-3 text-center bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">No clubs yet</p>
                </div>
              )}
            </div>
          )}

          {/* My Events Section */}
          {!isDashboardLoading && (
            <div className="mb-6">
              <div className="flex items-center justify-between px-4 mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  My Events {events.length > 0 && `(${events.length})`}
                </p>
                <button
                  onClick={() => openCreateModal('event')}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition"
                  title="Create New Event"
                >
                  <span className="text-xl leading-none pb-1">+</span>
                </button>
              </div>
              {events.length > 0 ? (
                <div className="space-y-1">
                  {events.map((event: any) => {
                    // Log event data to console
                    console.log('Event:', {
                      id: event.id,
                      title: event.title,
                      banner_url: event.banner_url,
                      event_date: event.event_date,
                      club_id: event.club_id,
                      club_name: event.club_name,
                      sponsor_name: event.sponsor_name,
                      user_role: event.user_role,
                      participant_count: event.participant_count,
                      channel_count: event.channel_count,
                      created_at: event.created_at
                    })

                    return (
                      <button
                        key={event.id}
                        onClick={() => {
                          setActiveSection(`event-${event.id}`)
                          setSelectedChannel(null) // Reset, will be set by useEffect
                          console.log('Clicked event:', event.id, event.title)
                          console.log('User role:', event.user_role)
                          console.log('Total channels:', event.channel_count)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${activeSection === `event-${event.id}`
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {event.banner_url ? (
                          <img src={event.banner_url} alt={event.title} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-400 rounded flex items-center justify-center text-white text-sm font-bold">
                            {event.title[0]}
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {event.club_name ? (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{event.club_name}</span>
                            ) : event.sponsor_name ? (
                              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{event.sponsor_name}</span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-3 text-center bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">No events yet</p>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-semibold">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'Not logged in'}
              </p>
            </div>
            <button
              onClick={() => setIsProfileSettingsOpen(true)}
              className="text-gray-400 hover:text-gray-600 transition"
              title="Profile Settings"
            >
              <span className="text-lg">⚙️</span>
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Secondary Sidebar - Channels (Discord-like) */}
      {(activeSection.startsWith('club-') || activeSection.startsWith('event-')) && (
        <aside className="w-60 bg-gray-100 border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Channel Header */}
          {(() => {
            const isClub = activeSection.startsWith('club-')
            const id = activeSection.replace(isClub ? 'club-' : 'event-', '')
            const item = isClub ? clubs.find((c: any) => c.id === id) : events.find((e: any) => e.id === id)
            const name = isClub ? item?.name : item?.title
            const banner = item?.banner_url

            if (banner) {
              return (
                <div className="relative h-28 bg-cover bg-center shrink-0 group" style={{ backgroundImage: `url(${banner})` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-end justify-between text-white w-full">
                      <div className="min-w-0 pr-2 flex-1">
                        <h3 className="font-bold text-lg leading-tight truncate drop-shadow-md text-white">{name}</h3>
                        <p className="text-[10px] font-medium text-gray-300 uppercase tracking-wide mt-0.5">
                          {isClub ? 'Club' : 'Event'} Channels
                        </p>
                      </div>
                      {item?.user_role === 'owner' && (
                        <button
                          onClick={() => openEditModal(item, isClub ? 'club' : 'event')}
                          className="p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded text-white transition opacity-0 group-hover:opacity-100"
                          title="Edit Settings"
                        >
                          <span className="text-sm leading-none">⚙️</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div className="p-4 border-b border-gray-200 bg-white flex items-start justify-between shrink-0">
                <div className="min-w-0 pr-2 flex-1">
                  <h3 className="font-semibold text-gray-800 truncate">{name || (isClub ? 'Club' : 'Event')}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {isClub ? 'Club' : 'Event'} channels
                  </p>
                </div>
                {item?.user_role === 'owner' && (
                  <button
                    onClick={() => openEditModal(item, isClub ? 'club' : 'event')}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 transition"
                    title="Edit Settings"
                  >
                    <span className="text-lg leading-none">⚙️</span>
                  </button>
                )}
              </div>
            )
          })()}

          {/* Channels List */}
          <nav className="flex-1 p-3 overflow-y-auto">
            {isChannelsLoading ? (
              <div className="flex items-center justify-center py-8">
                <ThreeDotLoader />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-2 mb-2 group">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Text Channels</span>
                  {(() => {
                    const isClub = activeSection.startsWith('club-')
                    const id = activeSection.replace(isClub ? 'club-' : 'event-', '')
                    const item = isClub ? clubs.find((c: any) => c.id === id) : events.find((e: any) => e.id === id)
                    if (item?.user_role === 'owner' || item?.owner_id === user?.id) {
                      return <button onClick={handleCreateChannel} className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none transition-colors" title="Create Channel">+</button>
                    }
                    return null
                  })()}
                </div>

                {channels && channels.length > 0 ? (
                  <div className="space-y-1">
                    {channels.map((channel: any) => (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedChannel(channel.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition group relative ${selectedChannel === channel.id
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        <span className="text-gray-500 text-lg">#</span>
                        <span className="text-sm font-medium truncate flex-1 text-left">{channel.name}</span>

                        {channel.visibility !== 'public' && (
                          <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded ml-2">
                            {channel.visibility === 'volunteer' ? 'Vol' : 'Own'}
                          </span>
                        )}

                        {(() => {
                          const isClub = activeSection.startsWith('club-')
                          const id = activeSection.replace(isClub ? 'club-' : 'event-', '')
                          const item = isClub ? clubs.find((c: any) => c.id === id) : events.find((e: any) => e.id === id)
                          if (item?.user_role === 'owner' || item?.owner_id === user?.id) {
                            return (
                              <span
                                onClick={(e) => handleDeleteChannel(e, channel.id)}
                                className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                title="Delete Channel"
                              >
                                🗑
                              </span>
                            )
                          }
                          return null
                        })()}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs italic">
                    No channels available
                  </div>
                )}
              </>
            )}
          </nav>

          {/* Settings Tab (Owner Only) */}
          {(() => {
            const isClub = activeSection.startsWith('club-')
            const id = activeSection.replace(isClub ? 'club-' : 'event-', '')
            const item = isClub ? clubs.find((c: any) => c.id === id) : events.find((e: any) => e.id === id)

            if (item?.user_role === 'owner' || item?.owner_id === user?.id) {
              return (
                <div className="p-3 border-t border-gray-200 bg-gray-50 mt-auto">
                  <button
                    onClick={() => openEditModal(item, isClub ? 'club' : 'event')}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg shadow-sm transition group"
                  >
                    <span className="group-hover:rotate-45 transition-transform duration-300">⚙️</span>
                    <span className="font-semibold text-sm">Settings</span>
                  </button>
                </div>
              )
            }
            return null
          })()}
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {!(activeSection.startsWith('club-') || activeSection.startsWith('event-')) ? (
                <div className="relative max-w-xl">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    readOnly
                    onClick={() => setIsSearchOpen(true)}
                    placeholder="Search events, clubs, or transactions..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:bg-gray-50 transition"
                  />
                </div>
              ) : (
                selectedChannel && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl text-gray-400 font-light">#</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-gray-900 leading-none">
                          {channels?.find((ch: any) => ch.id === selectedChannel)?.name}
                        </h1>
                        {channels?.find((ch: any) => ch.id === selectedChannel)?.visibility !== 'public' && (
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${channels?.find((ch: any) => ch.id === selectedChannel)?.visibility === 'volunteer'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {channels?.find((ch: any) => ch.id === selectedChannel)?.visibility}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate max-w-2xl mt-1">
                        {channels?.find((ch: any) => ch.id === selectedChannel)?.description}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <span className="text-xl">❓</span>
              </button>

              {/* Wallet Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeAddress
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                  {activeAddress ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <div className="text-left">
                        <div className="text-xs font-medium">CONNECTED</div>
                        <div className="text-xs font-mono">{formatAddress(activeAddress)}</div>
                      </div>
                      <span className="text-sm">▼</span>
                    </>
                  ) : (
                    <>
                      <span>Connect Wallet</span>
                      <span className="text-sm">▼</span>
                    </>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showWalletMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowWalletMenu(false)}
                    ></div>

                    {/* Menu Content */}
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                      {activeAddress ? (
                        <>
                          {/* Connected Wallet Info */}
                          <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Connected Wallet</p>
                            <p className="text-sm font-mono text-gray-900 break-all">{activeAddress}</p>
                          </div>

                          {/* Switch Wallet Options */}
                          <div className="px-2 py-2">
                            <p className="px-2 text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
                              Switch Wallet
                            </p>
                            <button
                              onClick={() => {
                                setShowWalletMenu(false)
                                connectPera()
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition text-left"
                            >
                              <span className="text-xl">👛</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Pera Wallet</p>
                                <p className="text-xs text-gray-500">Mainnet & Testnet</p>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setShowWalletMenu(false)
                                connectLocalnet()
                              }}
                              disabled={loading}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left disabled:opacity-50"
                            >
                              <span className="text-xl">🔗</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Localnet</p>
                                <p className="text-xs text-gray-500">Development & Testing</p>
                              </div>
                            </button>
                          </div>

                          {/* Disconnect Button */}
                          <div className="border-t border-gray-200 px-2 pt-2">
                            <button
                              onClick={() => {
                                const connectedWallet = wallets.find((w) => w.isConnected)
                                if (connectedWallet) {
                                  connectedWallet.disconnect()
                                }
                                setShowWalletMenu(false)
                              }}
                              className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition font-medium"
                            >
                              Disconnect Wallet
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Connect Wallet Options */}
                          <div className="px-2 py-2">
                            <p className="px-2 text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
                              Choose Wallet
                            </p>
                            <button
                              onClick={() => {
                                setShowWalletMenu(false)
                                connectPera()
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition text-left"
                            >
                              <span className="text-xl">👛</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Pera Wallet</p>
                                <p className="text-xs text-gray-500">Mainnet & Testnet</p>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setShowWalletMenu(false)
                                connectLocalnet()
                              }}
                              disabled={loading}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left disabled:opacity-50"
                            >
                              <span className="text-xl">🔗</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Localnet</p>
                                <p className="text-xs text-gray-500">Development & Testing</p>
                              </div>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Show Chat if channel is selected */}
          {selectedChannel ? (
            <div className="h-full flex flex-col">

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col custom-scrollbar">
                {isMessagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <ThreeDotLoader />
                  </div>
                ) : messagesError ? (
                  <div className="flex items-center justify-center h-full text-red-500 flex-col gap-2">
                    <p className="font-medium">Failed to load messages</p>
                    <p className="text-sm opacity-75">{(messagesError as any).response?.data?.error || 'Unknown error'}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Welcome Message */}
                    <div className="text-center py-8 border-b border-gray-200 border-dashed pb-8 mb-4">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-blue-600 font-light">#</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Welcome to #{channels?.find((ch: any) => ch.id === selectedChannel)?.name || selectedChannel}!
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">
                        This is the start of the <span className="font-medium">#{channels?.find((ch: any) => ch.id === selectedChannel)?.name}</span> channel history.
                      </p>
                    </div>

                    {/* Messages List */}
                    {messages?.map((msg: any) => (
                      <div key={msg.id} className="flex gap-4 group hover:bg-gray-100/50 p-2 -mx-2 rounded-lg transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm text-white font-bold select-none">
                          {msg.users?.avatar_url ? (
                            <img src={msg.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span>{(msg.users?.name || 'U')[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-gray-900 hover:underline cursor-pointer">{msg.users?.name || 'Unknown User'}</span>
                            <span className="text-xs text-gray-400 group-hover:text-gray-500 transition-colors">
                              {new Date(msg.created_at).toLocaleDateString() === new Date().toLocaleDateString()
                                ? `Today at ${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              }
                            </span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-3 items-center bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                  <button type="button" className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition">
                    <span className="text-xl leading-none">+</span>
                  </button>
                  <input
                    type="text"
                    value={messagesInput}
                    onChange={(e) => setMessagesInput(e.target.value)}
                    placeholder={`Message #${channels?.find((ch: any) => ch.id === selectedChannel)?.name || 'channel'}`}
                    className="flex-1 bg-transparent px-2 py-2 focus:outline-none text-gray-800 placeholder-gray-400"
                    disabled={isMessagesLoading}
                  />
                  <button
                    type="submit"
                    disabled={!messagesInput.trim() || isMessagesLoading}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transform rotate-[-45deg] translate-x-0.5 -translate-y-0.5">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </button>
                </form>
                <div className="text-xs text-gray-400 mt-2 px-2 flex justify-between">
                  <span>Markdown supported (bold, italic)</span>
                  {messagesInput.length > 0 && <span>{messagesInput.length} chars</span>}
                </div>
              </div>
            </div>
          ) : (
            /* Original Dashboard Content */
            <div className="p-8">
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back. Here's what's happening in your ecosystem today.</p>
              </div>

              {/* Metrics Cards */}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${canViewTreasury ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-8`}>
                {/* Total Treasury - Only show if user is organizer or member */}
                {canViewTreasury && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Treasury</p>
                        <h3 className="text-2xl font-bold text-gray-900">₹1,24,592.00</h3>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">🏛️</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-sm font-medium">↑ 4.2%</span>
                      <span className="text-gray-500 text-xs">Across all club accounts</span>
                    </div>
                  </div>
                )}

                {/* Active Events */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Events</p>
                      <h3 className="text-2xl font-bold text-gray-900">12</h3>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📅</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 text-sm font-medium">+3 pending approval</span>
                  </div>
                  <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>

                {/* Active Volunteers */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Volunteers</p>
                      <h3 className="text-2xl font-bold text-gray-900">86</h3>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">🙋</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-gray-600">+3</span>
                      </div>
                    </div>
                    <span className="text-green-600 text-sm font-medium">↑ 12%</span>
                  </div>
                </div>

                {/* Reward NFTs */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Reward NFTs Minted</p>
                      <h3 className="text-2xl font-bold text-gray-900">1,204</h3>
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">🎨</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">Total supply</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Next mint scheduled in 2 days</p>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Transactions */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Entity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Amount/Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span>💳</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Payment Received</p>
                                <p className="text-xs text-gray-500">Today, 10:24 AM</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">Chess Club</p>
                            <p className="text-xs text-gray-500">Escrow Locked</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Settled
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold text-green-600">+₹250.00</p>
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span>🎫</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Ticket Minted</p>
                                <p className="text-xs text-gray-500">Yesterday, 4:15 PM</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">Annual Gala</p>
                            <p className="text-xs text-gray-500">Asset Opt-In</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              Processing
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold text-gray-900">1 NFT</p>
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <span>📝</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Expense Logged</p>
                                <p className="text-xs text-gray-500">Yesterday, 2:30 PM</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">Volunteer Snacks</p>
                            <p className="text-xs text-gray-500">Audit Pending</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                              Review
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold text-red-600">-₹45.00</p>
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                                <span>📤</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">IPFS Upload</p>
                                <p className="text-xs text-gray-500">Oct 24, 11:00 AM</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">Event Space Docs</p>
                            <p className="text-xs text-gray-500">CID Stored</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Complete
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold text-gray-900">24MB</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Latest Notifications */}
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">Latest Notifications</h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">📋</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            <span className="font-semibold">New Policy:</span> Updated expense logging requirements.
                          </p>
                          <p className="text-xs text-gray-500">1 hour ago</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">⚠️</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            <span className="font-semibold">Action Required:</span> Verify 3 pending volunteer applications.
                          </p>
                          <p className="text-xs text-gray-500">4 hours ago</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">✅</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            <span className="font-semibold">System:</span> Atomic transfers settled successfully.
                          </p>
                          <p className="text-xs text-gray-500">Yesterday</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                      <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📝</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">New Expense</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Add Volunteer</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📅</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Event Setup</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">☁️</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Upload IPFS</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Event Status */}
              <div className="mt-8 bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Event Status</h2>
                  <button className="text-gray-400 hover:text-gray-600">
                    <span className="text-xl">⋯</span>
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Annual Gala 2024 */}
                    <div className="border border-gray-200 rounded-lg p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-bold text-lg">AG</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">Annual Gala 2024</h3>
                          <p className="text-sm text-gray-600">Ticket Sales & Setup</p>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Minting Tickets</span>
                          <span className="text-purple-600 font-semibold">85%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: "85%" }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Community Cleanup */}
                    <div className="border border-gray-200 rounded-lg p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-pink-600 font-bold text-lg">CC</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">Community Cleanup</h3>
                          <p className="text-sm text-gray-600">Volunteer Signup</p>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Shift Assignment</span>
                          <span className="text-pink-600 font-semibold">40%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-600 rounded-full" style={{ width: "40%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-800 font-medium">Connecting wallet...</p>
          </div>
        </div>
      )}

      {/* Create Entity Modal */}
      <CreateEntityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        type={createType}
        userClubs={clubs}
      />

      {/* Edit Entity Modal */}
      <EditEntityModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        type={editType}
        entity={editEntity}
        userClubs={clubs}
      />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        user={user}
      />
    </div>
  )
}

export default Dashboard
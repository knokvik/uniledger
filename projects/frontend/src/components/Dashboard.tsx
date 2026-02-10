import React, { useState } from "react"
import { useWallet, WalletId } from "@txnlab/use-wallet-react"
import { useAuth } from "../hooks/useAuth"

const Dashboard = () => {
  const { activeAddress, wallets } = useWallet()
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [showWalletMenu, setShowWalletMenu] = useState(false)

  // TODO: These should come from your backend/database
  // For now, setting as false - update based on actual user data
  const [isOrganizer] = useState(false) // Set to true if user is organizer of any event
  const [isMember] = useState(false) // Set to true if user is member of any club/event

  // User should see treasury only if they are organizer or member
  const canViewTreasury = isOrganizer || isMember

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
          <div className="mb-6">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeSection === "dashboard"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <span className="text-lg">📊</span>
              <span className="font-medium">Main Dashboard</span>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
              Management
            </p>
            <div className="space-y-1">
              {/* Treasury & Payments - Only show if user is organizer or member */}
              {canViewTreasury && (
                <button
                  onClick={() => setActiveSection("treasury")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${activeSection === "treasury"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <span className="text-lg">💰</span>
                  <span className="text-sm">Treasury & Payments</span>
                </button>
              )}
              <button
                onClick={() => setActiveSection("clubs")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${activeSection === "clubs"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="text-lg">👥</span>
                <span className="text-sm">Clubs</span>
              </button>
              <button
                onClick={() => setActiveSection("volunteers")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${activeSection === "volunteers"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="text-lg">🙋</span>
                <span className="text-sm">Volunteers</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
              Events & Ops
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveSection("events")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${activeSection === "events"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="text-lg">📅</span>
                <span className="text-sm">Events</span>
              </button>
              <button
                onClick={() => setActiveSection("tickets")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${activeSection === "tickets"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="text-lg">🎫</span>
                <span className="text-sm">Tickets & Assets</span>
              </button>
              <button
                onClick={() => setActiveSection("chats")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${activeSection === "chats"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="text-lg">💬</span>
                <span className="text-sm">Chats & Spaces</span>
              </button>
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {activeAddress ? activeAddress[0].toUpperCase() : "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">User</p>
              <p className="text-xs text-gray-500 truncate">
                {activeAddress ? formatAddress(activeAddress) : "Not connected"}
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search events, clubs, or transactions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <span className="text-xl">🔔</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
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
        <div className="flex-1 overflow-y-auto p-8">
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
    </div>
  )
}

export default Dashboard
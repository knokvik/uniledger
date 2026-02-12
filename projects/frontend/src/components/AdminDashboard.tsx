import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useChannels } from '../hooks/useChannels';
import { useMessages } from '../hooks/useMessages';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Stats {
    totalRevenue: string;
    totalClubs: number;
    pendingClubs: number;
    suspendedClubs: number;
    totalEvents: number;
    cancelledEvents: number;
    totalUsers: number;
}

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // View State
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'suspended'>('pending');
    const [selectedItem, setSelectedItem] = useState<any | null>(null); // Club or Event
    const [selectedType, setSelectedType] = useState<'club' | 'event'>('club');

    useEffect(() => {
        fetchOverview();
    }, []);

    const fetchOverview = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/admin/overview`, { withCredentials: true });
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch admin stats:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/admin/login');
            } else {
                setError('Failed to load system overview.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setViewMode('list');
        setSelectedItem(null);
    };

    if (loading) return <div className="p-10 text-center">Loading system data...</div>;
    // error strict check removed to allow partial load

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">UniLedger Admin</h1>
                    <p className="text-sm text-gray-500">System Oversight Dashboard</p>
                </div>
                <div className="flex gap-4">
                    <button className="text-gray-600 hover:text-gray-900" onClick={() => navigate('/dashboard')}>
                        View Site
                    </button>
                    <button
                        className="bg-red-50 text-red-600 px-4 py-2 rounded border border-red-100 hover:bg-red-100"
                        onClick={() => navigate('/admin/login')}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {viewMode === 'list' ? (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <StatCard title="Total Revenue" value={`$${stats?.totalRevenue}`} color="green" />
                            <StatCard title="Pending Requests" value={stats?.pendingClubs || 0} subtext="Require Approval" color="orange" />
                            <StatCard title="Total Users" value={stats?.totalUsers || 0} color="blue" />
                            <StatCard title="Suspended Items" value={stats?.suspendedClubs || 0} color="red" />
                        </div>

                        {/* Filter Tabs */}
                        <div className="mb-6 border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                <TabButton label="⚠️ Pending Approvals" active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} />
                                <TabButton label="✅ Active Clubs/Events" active={activeTab === 'active'} onClick={() => setActiveTab('active')} />
                                <TabButton label="🚫 Rejected/Suspended" active={activeTab === 'suspended'} onClick={() => setActiveTab('suspended')} />
                            </nav>
                        </div>

                        {/* List Content */}
                        <FilteredList
                            status={activeTab}
                            onSelect={(item, type) => {
                                setSelectedItem(item);
                                setSelectedType(type);
                                setViewMode('detail');
                            }}
                        />
                    </>
                ) : (
                    <DetailView
                        item={selectedItem}
                        type={selectedType}
                        onBack={handleBack}
                    />
                )}
            </main>
        </div>
    );
};

// --- Sub-Components ---

const StatCard = ({ title, value, subtext, color }: any) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-${color}-500`}>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
);

const TabButton = ({ label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${active
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
    >
        {label}
    </button>
);

const FilteredList = ({ status, onSelect }: { status: string, onSelect: (item: any, type: 'club' | 'event') => void }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                let data: any[] = [];
                if (status === 'pending') {
                    // Fetch from new Creation Requests API
                    const [clubReqs, eventReqs] = await Promise.all([
                        axios.get(`${API_URL}/api/admin/creation-requests/club`, { withCredentials: true }),
                        axios.get(`${API_URL}/api/admin/creation-requests/event`, { withCredentials: true })
                    ]);

                    if (clubReqs.data.success) data = [...data, ...clubReqs.data.data.map((i: any) => ({ ...i, type: 'club' }))];
                    if (eventReqs.data.success) data = [...data, ...eventReqs.data.data.map((i: any) => ({ ...i, type: 'event' }))];
                } else {
                    // Fetch Active/Suspended from existing APIs
                    // Improving this to specific status endpoint if needed, but reusing getAllClubs for now
                    const clubsRes = await axios.get(`${API_URL}/api/admin/clubs?status=${status}`, { withCredentials: true });
                    if (clubsRes.data.success) data = clubsRes.data.data.map((i: any) => ({ ...i, type: 'club' }));
                }
                setItems(data);
            } catch (error) {
                console.error("Error fetching items", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [status]);

    if (loading) return <div>Loading...</div>;
    if (items.length === 0) return <div className="text-gray-500 italic mt-8 text-center bg-white p-8 rounded border border-dashed">No items found with status: {status}</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
                <div
                    key={item.id}
                    onClick={() => onSelect(item, item.type || 'club')}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer overflow-hidden group"
                >
                    <div className="h-32 bg-gray-100 relative">
                        {item.banner_url ? (
                            <img src={item.banner_url} alt={item.name || item.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-4xl">
                                {item.type === 'event' ? '📅' : '🏰'}
                            </div>
                        )}
                        <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded uppercase ${item.status === 'active' ? 'bg-green-100 text-green-800' :
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {item.status}
                        </span>
                    </div>
                    <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition">{item.name || item.title}</h3>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description || 'No description provided.'}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 border-t pt-3">
                            <span>👤 {item.requested_by?.name || item.owner?.name || 'Unknown'}</span>
                            <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Detail View (Read-Only "Organizer View") ---
const DetailView = ({ item, type, onBack }: { item: any, type: 'club' | 'event', onBack: () => void }) => {
    // Determine active tab within detail view (Overview vs Channels)
    const [detailTab, setDetailTab] = useState<'overview' | 'channels'>('overview');
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

    // Fetch Channels (Only if NOT pending - pending requests don't have channels yet)
    const { data: channels, isLoading: channelsLoading } = useChannels(type, item.id);

    // Fetch Messages if channel selected
    const { messages, isLoading: messagesLoading } = useMessages(selectedChannel);

    // Handle Status Change
    const handleStatus = async (action: 'approve' | 'reject' | 'suspend' | 'reactivate') => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
        try {
            if (item.status === 'pending') {
                // New Creation Request Flow
                await axios.post(`${API_URL}/api/admin/creation-requests/${type}/${item.id}`, { action }, { withCredentials: true });
            } else {
                // Legacy Status Update Flow
                const newStatus = action === 'suspend' ? 'suspended' : 'active';
                await axios.patch(`${API_URL}/api/admin/${type}s/${item.id}/status`, { status: newStatus }, { withCredentials: true });
            }
            alert(`Action ${action} successful!`);
            onBack(); // Go back to list on change
        } catch (error: any) {
            console.error('Action failed', error);
            alert(`Failed to ${action}: ` + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
            {/* Detail Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-900 font-bold text-xl">←</button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{item.name || item.title}</h2>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">{type} • {item.status}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {item.status === 'pending' && (
                        <>
                            <button onClick={() => handleStatus('approve')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Approve</button>
                            <button onClick={() => handleStatus('reject')} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Reject</button>
                        </>
                    )}
                    {item.status === 'active' && (
                        <button onClick={() => handleStatus('suspend')} className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200">Suspend</button>
                    )}
                    {item.status === 'suspended' && (
                        <button onClick={() => handleStatus('reactivate')} className="bg-green-100 text-green-600 px-4 py-2 rounded hover:bg-green-200">Reactivate</button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Navigation & Channels */}
                <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-200">
                        <button
                            onClick={() => setDetailTab('overview')}
                            className={`w-full text-left px-3 py-2 rounded mb-2 ${detailTab === 'overview' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            ℹ️ Overview
                        </button>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 px-3">CHANNELS (READ-ONLY)</div>
                        {channelsLoading ? <div className="px-3 text-xs">Loading channels...</div> : (
                            <div className="space-y-1">
                                {channels?.map((ch: any) => (
                                    <button
                                        key={ch.id}
                                        onClick={() => {
                                            setDetailTab('channels');
                                            setSelectedChannel(ch.id);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${selectedChannel === ch.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <span className="text-gray-400">#</span> {ch.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Content Area */}
                <div className="flex-1 bg-white overflow-y-auto relative">
                    {detailTab === 'overview' ? (
                        <div className="p-8 max-w-3xl">
                            {item.banner_url && (
                                <img src={item.banner_url} alt="Banner" className="w-full h-48 object-cover rounded-lg mb-6 shadow-sm" />
                            )}
                            <h3 className="text-2xl font-bold mb-4">About</h3>
                            <p className="text-gray-700 leading-relaxed mb-8 whitespace-pre-wrap">{item.description}</p>

                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Owner</span>
                                    <span className="text-gray-800">{item.owner?.name} ({item.owner?.email})</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Created At</span>
                                    <span className="text-gray-800">{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                                {/* Treasury placeholder */}
                                <div className="col-span-2">
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Treasury Address</span>
                                    <code className="text-xs bg-gray-200 px-2 py-1 rounded block mt-1 break-all">{item.wallet_address || 'Not Configured'}</code>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                                <h3 className="font-bold text-gray-800"># {channels?.find((c: any) => c.id === selectedChannel)?.name}</h3>
                                <p className="text-xs text-gray-500">{channels?.find((c: any) => c.id === selectedChannel)?.description}</p>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50/50">
                                {messagesLoading ? <div>Loading messages...</div> : (
                                    messages?.length > 0 ? (
                                        messages.map((msg: any) => (
                                            <div key={msg.id} className="flex gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-xs font-bold text-gray-600">
                                                    {msg.user?.name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="font-bold text-sm text-gray-900">{msg.user?.name || 'Unknown'}</span>
                                                        <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="text-gray-800 text-sm mt-0.5">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-400 italic mt-10">No messages in this channel</div>
                                    )
                                )}
                            </div>

                            {/* Read Only Banner */}
                            <div className="p-3 bg-gray-100 border-t border-gray-200 text-center text-xs text-gray-500 font-medium">
                                🔒 Read-Only Mode (Admin View)
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

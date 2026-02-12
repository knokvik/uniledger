import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- Types ---
interface Stats {
    totalRevenue: string;
    totalClubs: number;
    activeClubs: number;
    suspendedClubs: number;
    pendingClubs: number;
    totalEvents: number;
    activeEvents: number;
    pendingEvents: number;
    cancelledEvents: number;
    totalUsers: number;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface Entity {
    id: string;
    name?: string; // Club
    title?: string; // Event
    description: string;
    banner_url: string;
    status: 'pending' | 'active' | 'suspended' | 'rejected' | 'cancelled';
    created_at: string;
    owner?: User;
    club?: { name: string }; // For Reviewing Events
    // ... any other fields
}

// --- API Helpers ---
const fetchStats = async () => {
    const res = await axios.get(`${API_URL}/api/admin/overview`, { withCredentials: true });
    return res.data.data;
};

const fetchEntities = async (type: 'club' | 'event', status?: string | null) => {
    // If status is 'pending', use the specific creation-requests endpoint for semantic clarity (or just use general list with filter)
    // We'll use the general list with status filter as it's more flexible for tables
    const endpoint = type === 'club' ? '/api/admin/clubs' : '/api/admin/events';
    const res = await axios.get(`${API_URL}${endpoint}`, {
        params: { status },
        withCredentials: true
    });
    return res.data.data;
};

// --- Components ---

const AdminDashboard: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'dashboard' | 'clubs' | 'events' | 'requests'>('dashboard');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans text-gray-800">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-10 shadow-sm">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
                        <span>UniLedger</span> <span className="text-gray-400 font-normal text-sm ml-1">Admin</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem
                        icon="📊" label="Dashboard"
                        active={activeSection === 'dashboard'}
                        onClick={() => setActiveSection('dashboard')}
                    />
                    <SidebarItem
                        icon="🏰" label="Clubs"
                        active={activeSection === 'clubs'}
                        onClick={() => setActiveSection('clubs')}
                    />
                    <SidebarItem
                        icon="📅" label="Events"
                        active={activeSection === 'events'}
                        onClick={() => setActiveSection('events')}
                    />
                    <SidebarItem
                        icon="📩" label="Requests"
                        active={activeSection === 'requests'}
                        onClick={() => setActiveSection('requests')}
                    />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">User</div>
                    <div className="flex items-center px-4 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">A</div>
                        <div className="text-sm">
                            <div className="font-medium text-gray-900">Administrator</div>
                            <div className="text-gray-500 text-xs">admin@uniledger.edu</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 flex flex-col">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 sticky top-0 z-10 shadow-sm gap-4">
                    <button className="text-sm text-gray-500 hover:text-blue-600" onClick={() => navigate('/dashboard')}>
                        View Client Site ↗
                    </button>
                    <button
                        onClick={() => navigate('/admin/login')}
                        className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition"
                    >
                        Sign Out
                    </button>
                </header>

                {/* Content Body */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {activeSection === 'dashboard' && <DashboardOverview />}
                    {activeSection === 'clubs' && <EntityManagementSection type="club" />}
                    {activeSection === 'events' && <EntityManagementSection type="event" />}
                    {activeSection === 'requests' && <RequestsSection />}
                </main>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
    >
        <span className="mr-3 text-lg">{icon}</span>
        {label}
    </button>
);

// --- Sections ---

const DashboardOverview = () => {
    const { data: stats, isLoading, error } = useQuery<Stats>({
        queryKey: ['adminStats'],
        queryFn: fetchStats,
        refetchInterval: 30000 // Live updates every 30s
    });

    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message="Failed to load stats" />;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">System Overview</h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`$${stats?.totalRevenue}`} icon="💰" color="emerald" />
                <StatCard title="Total Users" value={stats?.totalUsers} icon="👥" color="blue" />
                <StatCard title="Total Clubs" value={stats?.totalClubs} sub={`Active: ${stats?.activeClubs}`} icon="🏰" color="indigo" />
                <StatCard title="Total Events" value={stats?.totalEvents} sub={`Active: ${stats?.activeEvents}`} icon="📅" color="purple" />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Pending Requests" value={(stats?.pendingClubs || 0) + (stats?.pendingEvents || 0)} sub={`${stats?.pendingClubs} Clubs, ${stats?.pendingEvents} Events`} icon="⏳" color="amber" />
                <StatCard title="Suspended/Cancelled" value={(stats?.suspendedClubs || 0) + (stats?.cancelledEvents || 0)} icon="🚫" color="red" />
            </div>
        </div>
    );
};

const StatCard = ({ title, value, sub, icon, color }: any) => (
    <div className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-${color}-600 text-6xl font-bold`}>
            {icon}
        </div>
        <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900">{value ?? '-'}</h3>
            {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
        </div>
    </div>
);

const EntityManagementSection = ({ type }: { type: 'club' | 'event' }) => {
    const [statusFilter, setStatusFilter] = useState<string>('active');

    // Fetch Data
    const { data, isLoading, refetch } = useQuery({
        queryKey: [`admin${type}s`, statusFilter],
        queryFn: () => fetchEntities(type, statusFilter === 'all' ? null : statusFilter)
    });

    const queryClient = useQueryClient();

    // Mutations
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, newStatus }: { id: string, newStatus: string }) => {
            await axios.patch(`${API_URL}/api/admin/${type}s/${id}/status`, { status: newStatus }, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`admin${type}s`] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        },
        onError: (err: any) => alert(`Failed: ${err.response?.data?.error || err.message}`)
    });

    const handleToggleStatus = (item: Entity) => {
        const isSuspended = item.status === 'suspended' || item.status === 'cancelled';
        const action = isSuspended ? 'reactivate' : (type === 'club' ? 'suspend' : 'cancel');
        const targetStatus = isSuspended ? 'active' : (type === 'club' ? 'suspended' : 'cancelled');

        if (confirm(`Are you sure you want to ${action} this ${type}?`)) {
            toggleStatusMutation.mutate({ id: item.id, newStatus: targetStatus });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 capitalize">{type}s Management</h2>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                    {['all', 'active', 'suspended', 'cancelled'].filter(s => type === 'club' ? s !== 'cancelled' : s !== 'suspended').map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition ${statusFilter === s ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? <LoadingState /> : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {data?.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No {type}s found.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Entity</th>
                                    <th className="px-6 py-4">Owner</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.map((item: Entity) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0">
                                                    {item.banner_url && <img src={item.banner_url} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{item.name || item.title}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {item.owner?.name || 'Unknown'}
                                            <div className="text-xs text-gray-400">{item.owner?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleToggleStatus(item)}
                                                disabled={toggleStatusMutation.isPending}
                                                className={`text-sm font-medium px-3 py-1 rounded transition ${item.status === 'active'
                                                        ? 'text-red-600 hover:bg-red-50'
                                                        : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                            >
                                                {item.status === 'active' ? (type === 'club' ? 'Suspend' : 'Cancel') : 'Reactivate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

const RequestsSection = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const queryClient = useQueryClient();

    // Determine filter status for API
    const apiStatus = activeTab === 'approved' ? 'active' : activeTab === 'rejected' ? 'rejected' : 'pending';

    // Fetch Requests for both Clubs and Events
    const { data: clubData, isLoading: clubLoading } = useQuery({
        queryKey: ['adminReqs', 'club', apiStatus],
        queryFn: () => fetchEntities('club', apiStatus)
    });

    const { data: eventData, isLoading: eventLoading } = useQuery({
        queryKey: ['adminReqs', 'event', apiStatus],
        queryFn: () => fetchEntities('event', apiStatus)
    });

    const isLoading = clubLoading || eventLoading;
    const combinedData = [...(clubData || []).map((i: any) => ({ ...i, type: 'club' })), ...(eventData || []).map((i: any) => ({ ...i, type: 'event' }))];

    // Process Request Mutation
    const processMutation = useMutation({
        mutationFn: async ({ id, type, action }: { id: string, type: string, action: 'approve' | 'reject' }) => {
            await axios.post(`${API_URL}/api/admin/creation-requests/${type}/${id}`, { action }, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminReqs'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
            queryClient.invalidateQueries({ queryKey: ['adminclubs'] });
            queryClient.invalidateQueries({ queryKey: ['adminevents'] });
        },
        onError: (err: any) => alert(`Failed: ${err.response?.data?.error || err.message}`)
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Requests</h2>
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['adminReqs'] })}
                    className="p-2 text-gray-500 hover:text-blue-600 transition disabled:opacity-50"
                    disabled={isLoading}
                    title="Refresh Data"
                >
                    🔄
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['pending', 'approved', 'rejected'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {isLoading ? <LoadingState /> : (
                <div className="grid grid-cols-1 gap-4">
                    {combinedData.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            No {activeTab} requests found.
                        </div>
                    ) : (
                        combinedData.map((item: any) => (
                            <div key={`${item.type}-${item.id}`} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Image */}
                                <div className="w-full md:w-48 h-32 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                    {item.banner_url ? (
                                        <img src={item.banner_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">{item.type === 'club' ? '🏰' : '📅'}</div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${item.type === 'club' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {item.type}
                                        </span>
                                        <span className="text-xs text-gray-400">Created {new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name || item.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>

                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <span>👤</span> {item.owner?.name} ({item.owner?.email})
                                        </div>
                                    </div>
                                </div>

                                {/* Actions (Only for Pending) */}
                                {activeTab === 'pending' && (
                                    <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                                        <button
                                            onClick={() => {
                                                if (confirm('Approve this request?'))
                                                    processMutation.mutate({ id: item.id, type: item.type, action: 'approve' })
                                            }}
                                            disabled={processMutation.isPending}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium text-sm flex items-center justify-center gap-2"
                                        >
                                            ✅ Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Reject this request?'))
                                                    processMutation.mutate({ id: item.id, type: item.type, action: 'reject' })
                                            }}
                                            disabled={processMutation.isPending}
                                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm flex items-center justify-center gap-2"
                                        >
                                            ❌ Reject
                                        </button>
                                    </div>
                                )}
                                {activeTab !== 'pending' && (
                                    <div className="flex flex-col justify-center shrink-0 border-l pl-6">
                                        <StatusBadge status={item.status} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// --- Helpers ---

const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
        active: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        suspended: 'bg-red-100 text-red-800',
        rejected: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

const LoadingState = () => (
    <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-500 font-medium">Loading data...</span>
    </div>
);

const ErrorState = ({ message }: { message: string }) => (
    <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center">
        {message}
    </div>
);

export default AdminDashboard;

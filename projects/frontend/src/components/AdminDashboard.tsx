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
    role: string;
    created_at: string;
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
    member_count?: number;
    participant_count?: number;
    club?: { name: string };
    // Details
    members?: any[];
    participants?: any[];
    channels?: any[];
    events?: any[];
    payments?: any[];
    wallet_address?: string;
}

// --- API Helpers ---
const fetchStats = async () => {
    const res = await axios.get(`${API_URL}/api/admin/overview`, { withCredentials: true });
    return res.data.data;
};

const fetchEntities = async (type: 'club' | 'event' | 'user', status?: string | null) => {
    let endpoint = '';
    if (type === 'user') endpoint = '/api/admin/users';
    else endpoint = type === 'club' ? '/api/admin/clubs' : '/api/admin/events';

    const res = await axios.get(`${API_URL}${endpoint}`, {
        params: { status },
        withCredentials: true
    });
    return res.data.data;
};

const fetchEntityDetails = async (type: 'club' | 'event', id: string) => {
    const endpoint = type === 'club' ? `/api/admin/clubs/${id}` : `/api/admin/events/${id}`;
    const res = await axios.get(`${API_URL}${endpoint}`, { withCredentials: true });
    return res.data.data;
};

// --- Components ---

const AdminDashboard: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'dashboard' | 'users' | 'clubs' | 'events' | 'requests'>('dashboard');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans text-gray-800">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-10 shadow-sm">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
                        <span className="text-white font-bold text-lg">U</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
                        <span>UniLedger</span> <span className="text-gray-400 font-normal text-sm ml-1">Admin</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem icon="📊" label="Dashboard" active={activeSection === 'dashboard'} onClick={() => setActiveSection('dashboard')} />
                    <SidebarItem icon="👥" label="Users" active={activeSection === 'users'} onClick={() => setActiveSection('users')} />
                    <SidebarItem icon="🏰" label="Clubs" active={activeSection === 'clubs'} onClick={() => setActiveSection('clubs')} />
                    <SidebarItem icon="📅" label="Events" active={activeSection === 'events'} onClick={() => setActiveSection('events')} />
                    <SidebarItem icon="📩" label="Requests" active={activeSection === 'requests'} onClick={() => setActiveSection('requests')} />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">A</div>
                        <div className="text-sm">
                            <div className="font-medium text-gray-900">Administrator</div>
                            <button onClick={() => navigate('/admin/login')} className="text-xs text-red-500 hover:text-red-700">Sign Out</button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 flex flex-col">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 sticky top-0 z-10 shadow-sm">
                    <button className="text-sm text-gray-500 hover:text-blue-600 font-medium" onClick={() => navigate('/dashboard')}>
                        View Client Site ↗
                    </button>
                </header>

                <main className="flex-1 p-8 overflow-y-auto">
                    {activeSection === 'dashboard' && <DashboardOverview onNavigate={setActiveSection} />}
                    {activeSection === 'users' && <UsersSection />}
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
        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
    >
        <span className="mr-3 text-lg">{icon}</span>
        {label}
    </button>
);

const DashboardOverview = ({ onNavigate }: { onNavigate: (section: any) => void }) => {
    const { data: stats, isLoading, error } = useQuery<Stats>({
        queryKey: ['adminStats'],
        queryFn: fetchStats,
        refetchInterval: 30000
    });

    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message="Failed to load stats" />;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`$${stats?.totalRevenue}`} icon="💰" color="emerald" />
                <StatCard title="Total Users" value={stats?.totalUsers} icon="👥" color="blue" onClick={() => onNavigate('users')} />
                <StatCard title="Total Clubs" value={stats?.totalClubs} sub={`Active: ${stats?.activeClubs}`} icon="🏰" color="indigo" onClick={() => onNavigate('clubs')} />
                <StatCard title="Total Events" value={stats?.totalEvents} sub={`Active: ${stats?.activeEvents}`} icon="📅" color="purple" onClick={() => onNavigate('events')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Pending Requests" value={(stats?.pendingClubs || 0) + (stats?.pendingEvents || 0)} sub="Requires Action" icon="⏳" color="amber" onClick={() => onNavigate('requests')} />
                <StatCard title="Suspended Items" value={(stats?.suspendedClubs || 0) + (stats?.cancelledEvents || 0)} icon="🚫" color="red" />
            </div>
        </div>
    );
};

const StatCard = ({ title, value, sub, icon, color, onClick }: any) => (
    <div
        onClick={onClick}
        className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition ${onClick ? 'cursor-pointer' : ''}`}
    >
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

const UsersSection = () => {
    const [search, setSearch] = useState('');
    const { data, isLoading } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: () => fetchEntities('user')
    });

    const filteredData = data?.filter((u: User) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Users Management</h2>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            {isLoading ? <LoadingState /> : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                            <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Joined</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredData.map((user: User) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs lowercase">{user.role}</span></td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const EntityManagementSection = ({ type }: { type: 'club' | 'event' }) => {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: [`admin${type}s`, statusFilter],
        queryFn: () => fetchEntities(type, statusFilter === 'all' ? null : statusFilter)
    });

    if (selectedId) return <DetailView type={type} id={selectedId} onBack={() => setSelectedId(null)} />;

    const filteredData = data?.filter((i: Entity) =>
        (i.name || i.title || '').toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 capitalize">{type}s</h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder={`Search ${type}s...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
            </div>

            {isLoading ? <LoadingState /> : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Entity</th>
                                <th className="px-6 py-4">Owner</th>
                                <th className="px-6 py-4 text-center">{type === 'club' ? 'Members' : 'Participants'}</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredData.map((item: Entity) => (
                                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedId(item.id)}>
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
                                        {item.owner?.name} <span className="block text-xs text-gray-400">{item.owner?.email}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm font-medium">
                                        {type === 'club' ? item.member_count : item.participant_count}
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                    <td className="px-6 py-4 text-right text-xs text-blue-600 font-medium">View Details →</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const RequestsSection = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const queryClient = useQueryClient();
    const apiStatus = activeTab === 'approved' ? 'active' : activeTab === 'rejected' ? 'rejected' : 'pending';

    const { data: clubData, isLoading: cLoad } = useQuery({ queryKey: ['adminReqs', 'club', apiStatus], queryFn: () => fetchEntities('club', apiStatus) });
    const { data: eventData, isLoading: eLoad } = useQuery({ queryKey: ['adminReqs', 'event', apiStatus], queryFn: () => fetchEntities('event', apiStatus) });

    const isLoading = cLoad || eLoad;
    const combined = [...(clubData || []).map((i: any) => ({ ...i, type: 'club' })), ...(eventData || []).map((i: any) => ({ ...i, type: 'event' }))];

    const processMutation = useMutation({
        mutationFn: async ({ id, type, action }: any) => {
            await axios.post(`${API_URL}/api/admin/creation-requests/${type}/${id}`, { action }, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminReqs'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        },
        onError: (e: any) => alert(e.response?.data?.error || 'Action failed')
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Requests</h2>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['pending', 'approved', 'rejected'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab}</button>
                    ))}
                </nav>
            </div>
            {isLoading ? <LoadingState /> : (
                <div className="grid gap-4">
                    {combined.length === 0 ? <div className="text-center py-10 text-gray-500">No {activeTab} requests.</div> :
                        combined.map((item: any) => (
                            <div key={`${item.type}-${item.id}`} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6">
                                <div className="w-48 h-32 rounded bg-gray-100 overflow-hidden shrink-0">
                                    {item.banner_url ? <img src={item.banner_url} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-2xl">📷</div>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex gap-2 mb-2"><span className="uppercase text-xs font-bold bg-blue-100 text-blue-700 px-2 rounded">{item.type}</span></div>
                                    <h3 className="text-xl font-bold text-gray-900">{item.name || item.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                                    <div className="text-sm text-gray-500">👤 {item.owner?.name} ({item.owner?.email})</div>
                                </div>
                                {activeTab === 'pending' && (
                                    <div className="flex flex-col gap-2 justify-center border-l pl-6">
                                        <button onClick={() => confirm('Approve?') && processMutation.mutate({ id: item.id, type: item.type, action: 'approve' })} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                                        <button onClick={() => confirm('Reject?') && processMutation.mutate({ id: item.id, type: item.type, action: 'reject' })} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Reject</button>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

const DetailView = ({ type, id, onBack }: { type: 'club' | 'event', id: string, onBack: () => void }) => {
    const { data: item, isLoading } = useQuery({
        queryKey: [`adminDetail`, type, id],
        queryFn: () => fetchEntityDetails(type, id)
    });
    const queryClient = useQueryClient();

    const statusMutation = useMutation({
        mutationFn: async ({ status }: { status: string }) => {
            await axios.patch(`${API_URL}/api/admin/${type}s/${id}/status`, { status }, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`adminDetail`, type, id] });
            queryClient.invalidateQueries({ queryKey: [`admin${type}s`] });
        },
        onError: (e: any) => alert(e.response?.data?.error || 'Action failed')
    });

    if (isLoading) return <LoadingState />;
    if (!item) return <ErrorState message="Item not found" />;

    const isSuspended = item.status === 'suspended' || item.status === 'cancelled';
    const targetSuspend = type === 'club' ? 'suspended' : 'cancelled';

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-[500px] flex flex-col">
            <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-xl">
                <button onClick={onBack} className="text-gray-600 font-bold hover:text-black">← Back to List</button>
                <div className="flex gap-2">
                    <StatusBadge status={item.status} />
                    {item.status === 'active' && (
                        <button onClick={() => confirm('Suspend?') && statusMutation.mutate({ status: targetSuspend })} className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm font-medium hover:bg-red-200">Suspend</button>
                    )}
                    {isSuspended && (
                        <button onClick={() => confirm('Reactivate?') && statusMutation.mutate({ status: 'active' })} className="bg-green-100 text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-green-200">Reactivate</button>
                    )}
                </div>
            </div>
            <div className="p-8 overflow-y-auto">
                <div className="flex gap-8 mb-8">
                    <div className="w-48 h-32 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {item.banner_url && <img src={item.banner_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name || item.title}</h1>
                        <p className="text-gray-600 max-w-2xl">{item.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Owner Details</h3>
                        <p><strong>Name:</strong> {item.owner?.name}</p>
                        <p><strong>Email:</strong> {item.owner?.email}</p>
                        <p><strong>Treasury:</strong> <code className="bg-gray-200 px-1 rounded">{item.wallet_address || 'N/A'}</code></p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">{type === 'club' ? 'Statistics' : 'Event Stats'}</h3>
                        {type === 'club' ? (
                            <div className="space-y-2">
                                <p>Members: {item.members?.length || 0}</p>
                                <p>Events: {item.events?.length || 0}</p>
                                <p>Channels: {item.channels?.length || 0}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p>Participants: {item.participants?.length || 0}</p>
                                <p>Sponsor: {item.club?.name || 'Independent'}</p>
                            </div>
                        )}
                    </div>

                    {type === 'club' && item.events?.length > 0 && (
                        <div className="col-span-2">
                            <h3 className="font-bold text-lg mb-4">Latest Events</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {item.events.map((e: any) => (
                                    <div key={e.id} className="border p-3 rounded bg-white">
                                        <div className="font-medium">{e.title}</div>
                                        <div className="text-xs text-gray-500">{new Date(e.start_date).toLocaleDateString()}</div>
                                        <StatusBadge status={e.status} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = { active: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', suspended: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-800', rejected: 'bg-red-100 text-red-800' };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const LoadingState = () => <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
const ErrorState = ({ message }: { message: string }) => <div className="bg-red-50 text-red-600 p-4 rounded text-center">{message}</div>;

export default AdminDashboard;

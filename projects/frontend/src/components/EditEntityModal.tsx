import React, { useState, useEffect } from 'react'
import { useUpdateEntity } from '../hooks/useUpdateEntity'
import { useChannels } from '../hooks/useChannels'
import { useManageChannels } from '../hooks/useManageChannels'
import { useDeleteClub, useDeleteEvent } from '../hooks/useDashboard'

interface EditEntityModalProps {
    isOpen: boolean
    onClose: () => void
    type: 'club' | 'event'
    entity: any
    userClubs?: any[]
}

const EditEntityModal: React.FC<EditEntityModalProps> = ({ isOpen, onClose, type, entity, userClubs = [] }) => {
    const { updateClub, updateEvent } = useUpdateEntity()
    const { createChannel, updateChannel, deleteChannel } = useManageChannels()
    const { mutateAsync: deleteClub } = useDeleteClub()
    const { mutateAsync: deleteEvent } = useDeleteEvent()

    const { data: channels, isLoading: isChannelsLoading } = useChannels(type, entity?.id)

    const [activeTab, setActiveTab] = useState<'details' | 'channels'>('details')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        banner_url: '',
        logo_url: '',
        title: '',
        event_date: '',
        location: '',
        sponsor_name: '',
        club_id: '',
        wallet_address: '',
        ticket_price: ''
    })

    // Load entity data when modal opens or entity changes
    useEffect(() => {
        if (entity && isOpen) {
            setFormData({
                name: entity.name || '',
                description: entity.description || '',
                banner_url: entity.banner_url || '',
                logo_url: entity.logo_url || '',
                title: entity.title || '',
                event_date: entity.event_date ? new Date(entity.event_date).toISOString().slice(0, 16) : '',
                location: entity.location || '',
                sponsor_name: entity.sponsor_name || '',
                club_id: entity.club_id || '',
                wallet_address: entity.wallet_address || '',
                ticket_price: entity.ticket_price || ''
            })
        }
    }, [entity, isOpen])

    // Handle Input Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    // --- Channel Handlers ---
    const handleAddChannel = async () => {
        const name = prompt('Channel Name:')
        if (!name) return
        const visibility = prompt('Visibility (public/volunteer/owner):', 'public') || 'public'

        try {
            await createChannel.mutateAsync({
                name,
                visibility,
                type,
                type_id: entity.id
            })
        } catch (e: any) {
            alert(e.message || 'Failed to create channel')
        }
    }

    const handleDeleteChannelWrapper = async (id: string) => {
        if (!confirm('Are you sure you want to delete this channel?')) return
        try {
            await deleteChannel.mutateAsync(id)
        } catch (e: any) {
            alert(e.message || 'Failed to delete channel')
        }
    }

    const handleEditChannel = async (channel: any) => {
        const name = prompt('New Name:', channel.name)
        if (name === null) return
        const visibility = prompt('New Visibility (public/volunteer/owner):', channel.visibility)

        try {
            await updateChannel.mutateAsync({
                id: channel.id,
                data: { name: name || channel.name, visibility: visibility || channel.visibility }
            })
        } catch (e: any) {
            alert(e.message || 'Failed to update channel')
        }
    }

    // --- Update Handlers ---
    const handleUpdateClub = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await updateClub.mutateAsync({
                id: entity.id,
                data: {
                    name: formData.name,
                    description: formData.description,
                    banner_url: formData.banner_url || null,
                    logo_url: formData.logo_url || null
                }
            })
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update club')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await updateEvent.mutateAsync({
                id: entity.id,
                data: {
                    title: formData.title,
                    description: formData.description,
                    event_date: formData.event_date || null,
                    location: formData.location || null,
                    sponsor_name: formData.sponsor_name || null,
                    banner_url: formData.banner_url || null,
                    club_id: formData.club_id || null,
                    wallet_address: formData.wallet_address || null,
                    ticket_price: formData.ticket_price ? parseFloat(formData.ticket_price) : null
                }
            })
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update event')
        } finally {
            setLoading(false)
        }
    }

    // --- Delete Handlers ---
    const handleDeleteEntity = async () => {
        const confirmMsg = type === 'club'
            ? `Are you sure you want to delete the club "${entity.name}"? This cannot be undone.`
            : `Are you sure you want to delete the event "${entity.title}"? This cannot be undone.`

        if (!confirm(confirmMsg)) return

        setLoading(true)
        try {
            if (type === 'club') {
                await deleteClub(entity.id)
            } else {
                await deleteEvent(entity.id)
            }
            onClose()
            // Optional: Redirect logic if currently viewing the deleted entity is handled by Dashboard causing re-render/nav
        } catch (err: any) {
            alert(err.response?.data?.error || `Failed to delete ${type}`)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col relative animate-in zoom-in duration-200">
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white rounded-t-lg z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Edit {type === 'club' ? 'Club' : 'Event'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {type === 'club' ? formData.name : formData.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs - Fixed below header */}
                <div className="flex border-b shrink-0 bg-gray-50 px-6">
                    <button
                        className={`px-4 py-3 border-b-2 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Basic Details
                    </button>
                    <button
                        className={`px-4 py-3 border-b-2 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'channels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('channels')}
                    >
                        Channels & Roles
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-100 flex items-start gap-2">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {activeTab === 'details' ? (
                        <form id="edit-entity-form" onSubmit={type === 'club' ? handleUpdateClub : handleUpdateEvent} className="space-y-6">
                            {/* Club Fields */}
                            {type === 'club' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Club Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Logo URL</label>
                                            <input
                                                type="text"
                                                name="logo_url"
                                                value={formData.logo_url}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Banner URL</label>
                                            <input
                                                type="text"
                                                name="banner_url"
                                                value={formData.banner_url}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Event Fields */}
                            {type === 'event' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Event Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                name="event_date"
                                                value={formData.event_date}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Linked Club</label>
                                        <select
                                            name="club_id"
                                            value={formData.club_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition"
                                        >
                                            <option value="">None (Independent Event)</option>
                                            {userClubs.map((club: any) => (
                                                <option key={club.id} value={club.id}>
                                                    {club.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Sponsor Name</label>
                                            <input
                                                type="text"
                                                name="sponsor_name"
                                                value={formData.sponsor_name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Banner URL</label>
                                            <input
                                                type="text"
                                                name="banner_url"
                                                value={formData.banner_url}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Ticketing & Payments</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Ticket Price (ALGO)</label>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    name="ticket_price"
                                                    value={formData.ticket_price}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Wallet Address</label>
                                                <input
                                                    type="text"
                                                    name="wallet_address"
                                                    value={formData.wallet_address}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
                                                    placeholder="Algorand Address"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div>
                                    <h3 className="font-bold text-blue-900">Manage Channels</h3>
                                    <p className="text-sm text-blue-700 mt-1">Add or remove discussion channels for your members.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddChannel}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                                >
                                    <span className="text-lg leading-none pb-0.5">+</span> Create Channel
                                </button>
                            </div>

                            <div className="space-y-3">
                                {isChannelsLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-2"></div>
                                        <p className="text-gray-500 text-sm">Loading channels...</p>
                                    </div>
                                ) : channels && channels.length > 0 ? (
                                    channels.map((ch: any) => (
                                        <div key={ch.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group">
                                            <div className="flex-1 min-w-0 mr-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-400 text-xl font-light">#</span>
                                                    <span className="font-semibold text-gray-800">{ch.name}</span>
                                                    {ch.visibility !== 'public' && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${ch.visibility === 'volunteer' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {ch.visibility}
                                                        </span>
                                                    )}
                                                </div>
                                                {ch.description && <p className="text-sm text-gray-500 truncate mt-1 pl-6">{ch.description}</p>}
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditChannel(ch)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                    title="Edit Channel"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteChannelWrapper(ch.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete Channel"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <p className="text-gray-500 text-sm">No channels found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Fixed */}
                <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-lg shrink-0">
                    <button
                        type="button"
                        onClick={handleDeleteEntity}
                        className="px-4 py-2 text-red-600 font-medium hover:bg-red-100 rounded-lg transition flex items-center gap-2"
                        title={`Delete this ${type}`}
                    >
                        <span>🗑</span> Delete {type === 'club' ? 'Club' : 'Event'}
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-gray-600 font-medium hover:text-gray-800 hover:bg-gray-200 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        {activeTab === 'details' && (
                            <button
                                type="submit"
                                form="edit-entity-form"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-200"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Save Changes
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditEntityModal

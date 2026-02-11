import React, { useState, useEffect } from 'react'
import { useUpdateEntity } from '../hooks/useUpdateEntity'
import { useChannels } from '../hooks/useChannels'
import { useManageChannels } from '../hooks/useManageChannels'

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
    const { data: channels, isLoading: isChannelsLoading } = useChannels(type, entity?.id)

    const [activeTab, setActiveTab] = useState<'details' | 'channels'>('details')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Channel Handlers
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

    const handleDeleteChannel = async (id: string) => {
        if (!confirm('Are you sure?')) return
        try {
            await deleteChannel.mutateAsync(id)
        } catch (e: any) {
            alert(e.message || 'Failed to delete channel')
        }
    }

    const handleEditChannel = async (channel: any) => {
        const name = prompt('New Name:', channel.name)
        if (name === null) return // Cancelled
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
        club_id: ''
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
                event_date: entity.event_date ? new Date(entity.event_date).toISOString().slice(0, 16) : '', // Format for datetime-local
                location: entity.location || '',
                sponsor_name: entity.sponsor_name || '',
                club_id: entity.club_id || ''
            })
        }
    }, [entity, isOpen])

    // Handle Input Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    // Handle Update Club
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

    // Handle Update Event
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
                    club_id: formData.club_id || null
                }
            })
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update event')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto py-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative my-8">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-6">
                    Edit {type === 'club' ? 'Club' : 'Event'}
                </h2>

                {/* Tabs */}
                <div className="flex border-b mb-6">
                    <button
                        className={`px-4 py-2 border-b-2 font-medium focus:outline-none transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Basic Details
                    </button>
                    <button
                        className={`px-4 py-2 border-b-2 font-medium focus:outline-none transition-colors ${activeTab === 'channels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('channels')}
                    >
                        Channels
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {activeTab === 'details' ? (
                    <form onSubmit={type === 'club' ? handleUpdateClub : handleUpdateEvent} className="space-y-4">

                        {/* Club Fields */}
                        {type === 'club' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                                        <input
                                            type="text"
                                            name="logo_url"
                                            value={formData.logo_url}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Banner URL</label>
                                        <input
                                            type="text"
                                            name="banner_url"
                                            value={formData.banner_url}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Event Fields */}
                        {type === 'event' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="datetime-local"
                                            name="event_date"
                                            value={formData.event_date}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link to Club</label>
                                    <select
                                        name="club_id"
                                        value={formData.club_id}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="">None (Independent Event)</option>
                                        {userClubs.map((club: any) => (
                                            <option key={club.id} value={club.id}>
                                                {club.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor</label>
                                        <input
                                            type="text"
                                            name="sponsor_name"
                                            value={formData.sponsor_name}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Banner URL</label>
                                        <input
                                            type="text"
                                            name="banner_url"
                                            value={formData.banner_url}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Save Changes
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div>
                                <h3 className="font-semibold text-gray-800">Channels</h3>
                                <p className="text-xs text-gray-500">Create, edit, or remove channels.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddChannel}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-1"
                            >
                                <span className="text-lg leading-none">+</span> New
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            {isChannelsLoading ? (
                                <div className="text-center py-8 text-gray-400">Loading channels...</div>
                            ) : channels && channels.length > 0 ? (
                                channels.map((ch: any) => (
                                    <div key={ch.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition group shadow-sm">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-700 text-sm"># {ch.name}</span>
                                                {ch.visibility !== 'public' && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${ch.visibility === 'volunteer' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {ch.visibility}
                                                    </span>
                                                )}
                                            </div>
                                            {ch.description && <p className="text-xs text-gray-400 truncate mt-0.5">{ch.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => handleEditChannel(ch)}
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition"
                                                title="Edit Channel"
                                            >
                                                ✎
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteChannel(ch.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                                                title="Delete Channel"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-gray-500 text-sm">No channels found.</p>
                                    <button onClick={handleAddChannel} className="text-blue-600 text-sm font-medium hover:underline mt-1">Create your first channel</button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t mt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div >
    )
}

export default EditEntityModal

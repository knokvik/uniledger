import React, { useState } from 'react'
import { useCreateEntity } from '../hooks/useCreateEntity'

interface CreateEntityModalProps {
    isOpen: boolean
    onClose: () => void
    type: 'club' | 'event'
    userClubs?: any[]
}

// Helper: Check if image URL is valid (with timeout)
const validateImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const img = new Image()
        const timer = setTimeout(() => resolve(false), 5000) // 5s timeout to prevent hanging

        img.onload = () => {
            clearTimeout(timer)
            resolve(true)
        }

        img.onerror = () => {
            clearTimeout(timer)
            resolve(false)
        }

        img.src = url
    })
}

const CreateEntityModal: React.FC<CreateEntityModalProps> = ({ isOpen, onClose, type, userClubs = [] }) => {
    const { createClub, createEvent } = useCreateEntity()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

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
        ticket_price: '',
        channels: [
            { name: 'general', description: 'General discussion', visibility: 'public' },
            { name: 'announcements', description: 'Announcements', visibility: 'public' },
            { name: 'volunteers', description: 'Volunteer coordination', visibility: 'volunteer' }
        ]
    })

    // Handle Input Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    // Handle Channel Changes
    const handleChannelChange = (index: number, field: string, value: string) => {
        const updatedChannels = [...formData.channels]
        updatedChannels[index] = { ...updatedChannels[index], [field]: value }
        setFormData({ ...formData, channels: updatedChannels })
    }

    const handleAddChannel = () => {
        setFormData({
            ...formData,
            channels: [
                ...formData.channels,
                { name: '', description: '', visibility: 'public' }
            ]
        })
    }

    const handleRemoveChannel = (index: number) => {
        setFormData({
            ...formData,
            channels: formData.channels.filter((_, i) => i !== index)
        })
    }

    // Handle Create Club
    const handleCreateClub = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (formData.channels.length === 0) {
            setError('At least one channel is required')
            setLoading(false)
            return
        }

        // Validate Word Count
        const wordCount = formData.description.trim().split(/\s+/).filter(Boolean).length
        if (wordCount > 100) {
            setError(`Description is too long (${wordCount}/100 words). Please shorten it.`)
            setLoading(false)
            return
        }

        // Validate Images
        if (formData.logo_url) {
            const isValid = await validateImage(formData.logo_url)
            if (!isValid) {
                setError('❌ Invalid Logo URL: Image could not be loaded or timed out')
                setLoading(false)
                return
            }
        }

        if (formData.banner_url) {
            const isValid = await validateImage(formData.banner_url)
            if (!isValid) {
                setError('❌ Invalid Banner URL: Image could not be loaded or timed out')
                setLoading(false)
                return
            }
        }

        try {
            await createClub.mutateAsync({
                name: formData.name,
                description: formData.description,
                banner_url: formData.banner_url,
                logo_url: formData.logo_url,
                channels: formData.channels
            })
            onClose()
            resetForm()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create club')
        } finally {
            setLoading(false)
        }
    }

    // Handle Create Event
    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Validate Word Count
        const wordCount = formData.description.trim().split(/\s+/).filter(Boolean).length
        if (wordCount > 100) {
            setError(`Description is too long (${wordCount}/100 words). Please shorten it.`)
            setLoading(false)
            return
        }

        // Validation: Mandatory fields
        if (!formData.title || !formData.description || !formData.banner_url || !formData.event_date || !formData.location || formData.ticket_price === '') {
            setError('All fields except "Sponsor" and "Link to Club" are required.')
            setLoading(false)
            return
        }

        // Validation: At least one channel required
        if (formData.channels.length === 0) {
            setError('At least one channel is required')
            setLoading(false)
            return
        }

        // Validation: If ticket price > 0, wallet address is required
        const price = parseFloat(formData.ticket_price)
        if (price > 0 && !formData.wallet_address.trim()) {
            setError('⚠️ Wallet address is required for paid events')
            setLoading(false)
            return
        }

        if (formData.banner_url) {
            const isValid = await validateImage(formData.banner_url)
            if (!isValid) {
                setError('❌ Invalid Banner URL: Image could not be loaded or timed out')
                setLoading(false)
                return
            }
        }

        try {
            await createEvent.mutateAsync({
                title: formData.title,
                description: formData.description,
                event_date: formData.event_date || null,
                location: formData.location || null,
                sponsor_name: formData.sponsor_name || null,
                banner_url: formData.banner_url || null,
                club_id: formData.club_id || null,
                wallet_address: formData.wallet_address ? formData.wallet_address.trim() : null,
                ticket_price: formData.ticket_price ? parseFloat(formData.ticket_price) : 0,
                channels: formData.channels
            })
            onClose()
            resetForm()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create event')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
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
            ticket_price: '',
            channels: [
                { name: 'general', description: 'General discussion', visibility: 'public' },
                { name: 'announcements', description: 'Announcements', visibility: 'public' },
                { name: 'volunteers', description: 'Volunteer coordination', visibility: 'volunteer' }
            ]
        })
    }

    // Lock body scroll when modal is open
    React.useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <h2 className="text-2xl font-bold">
                        Create New {type === 'club' ? 'Club' : 'Event'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form id="create-entity-form" onSubmit={type === 'club' ? handleCreateClub : handleCreateEvent} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">Basic Details</h3>
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
                                                placeholder="e.g. Coding Club"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-gray-700">Description *</label>
                                                <span className={`text-xs ${formData.description.trim().split(/\s+/).filter(Boolean).length > 100
                                                    ? 'text-red-500 font-bold'
                                                    : 'text-gray-400'
                                                    }`}>
                                                    {formData.description.trim().split(/\s+/).filter(Boolean).length}/100 words
                                                </span>
                                            </div>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                required
                                                rows={3}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${formData.description.trim().split(/\s+/).filter(Boolean).length > 100
                                                    ? 'border-red-300 focus:ring-red-500'
                                                    : 'border-gray-200 focus:ring-blue-500'
                                                    }`}
                                                placeholder="What is this club about?"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL *</label>
                                            <input
                                                type="text"
                                                name="logo_url"
                                                value={formData.logo_url}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Banner URL *</label>
                                            <input
                                                type="text"
                                                name="banner_url"
                                                value={formData.banner_url}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="https://..."
                                            />
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
                                                placeholder="e.g. Hackathon 2026"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-gray-700">Description *</label>
                                                <span className={`text-xs ${formData.description.trim().split(/\s+/).filter(Boolean).length > 100
                                                    ? 'text-red-500 font-bold'
                                                    : 'text-gray-400'
                                                    }`}>
                                                    {formData.description.trim().split(/\s+/).filter(Boolean).length}/100 words
                                                </span>
                                            </div>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                required
                                                rows={3}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${formData.description.trim().split(/\s+/).filter(Boolean).length > 100
                                                    ? 'border-red-300 focus:ring-red-500'
                                                    : 'border-gray-200 focus:ring-blue-500'
                                                    }`}
                                                placeholder="Event details..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                            <input
                                                type="datetime-local"
                                                name="event_date"
                                                value={formData.event_date}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="e.g. Auditorium"
                                            />
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
                                                    placeholder="Sponsor Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner URL *</label>
                                                <input
                                                    type="text"
                                                    name="banner_url"
                                                    value={formData.banner_url}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price (ALGO) *</label>
                                            <input
                                                type="number"
                                                name="ticket_price"
                                                value={formData.ticket_price}
                                                onChange={handleChange}
                                                required
                                                step="0.001"
                                                min="0"
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="0.00 (Enter 0 for free)"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Wallet Address {parseFloat(formData.ticket_price) > 0 && <span className="text-red-500">*</span>}
                                                <span className="text-gray-400 text-xs font-normal ml-1">
                                                    (Required only if paid)
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                name="wallet_address"
                                                value={formData.wallet_address}
                                                onChange={handleChange}
                                                required={parseFloat(formData.ticket_price) > 0}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm ${parseFloat(formData.ticket_price) > 0 && !formData.wallet_address.trim() ? 'border-red-300' : ''
                                                    }`}
                                                placeholder="Algorand Wallet Address"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Channels Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="font-semibold text-gray-900">Channels</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddChannel}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        + Add Channel
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {formData.channels.map((channel, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative group">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveChannel(index)}
                                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                title="Remove Channel"
                                            >
                                                ✕
                                            </button>

                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={channel.name}
                                                            onChange={(e) => handleChannelChange(index, 'name', e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                            placeholder="Channel Name"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="w-1/3">
                                                        <select
                                                            value={channel.visibility}
                                                            onChange={(e) => handleChannelChange(index, 'visibility', e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                                        >
                                                            <option value="public">Public</option>
                                                            <option value="volunteer">Volunteer</option>
                                                            <option value="owner">Owner</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={channel.description}
                                                        onChange={(e) => handleChannelChange(index, 'description', e.target.value)}
                                                        className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                        placeholder="Description (optional)"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                    These channels will be created automatically. You can manage them later.
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer - Fixed */}
                <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-entity-form"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Create {type === 'club' ? 'Club' : 'Event'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreateEntityModal

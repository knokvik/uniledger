import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ThreeDotLoader from './ThreeDotLoader'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface SearchModalProps {
    isOpen: boolean
    onClose: () => void
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<{ clubs: any[], events: any[] }>({ clubs: [], events: [] })
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('')
            setResults({ clubs: [], events: [] })
            setTimeout(() => {
                inputRef.current?.focus()
            }, 50)
        }
    }, [isOpen])

    const handleSearch = async (val: string) => {
        setQuery(val)
        if (val.trim().length === 0) {
            setResults({ clubs: [], events: [] })
            return
        }

        setLoading(true)
        try {
            const response = await axios.get(`${API_URL}/api/search?q=${val}`, { withCredentials: true })
            if (response.data.success) {
                setResults(response.data.data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Search Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                    <span className="text-gray-400 text-xl">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search for clubs or events..."
                        className="flex-1 text-lg outline-none placeholder-gray-400 text-gray-800"
                    />
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs bg-gray-100 px-2.5 py-1.5 rounded-md font-medium border border-gray-200 uppercase tracking-wide">ESC</button>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[300px]">
                    {loading && (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-gray-400">
                            <ThreeDotLoader />
                            <p className="mt-4 text-sm font-medium">Searching ecosystem...</p>
                        </div>
                    )}

                    {!loading && query && results.clubs.length === 0 && results.events.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-gray-400">
                            <span className="text-4xl mb-4 opacity-50">🤔</span>
                            <p className="text-lg font-medium text-gray-600">No results found</p>
                            <p className="text-sm">We couldn't find anything matching "{query}"</p>
                        </div>
                    )}

                    {!loading && !query && (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-gray-400">
                            <span className="text-4xl mb-4 opacity-50">✨</span>
                            <p className="text-lg font-medium text-gray-600">Search UniLedger</p>
                            <p className="text-sm max-w-xs text-center">Find clubs, events, and communities to join.</p>
                        </div>
                    )}

                    {!loading && (results.clubs.length > 0 || results.events.length > 0) && (
                        <div className="space-y-6">
                            {/* Clubs Section */}
                            {results.clubs.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 sticky top-0 bg-white pb-2 border-b border-gray-100">Clubs</h3>
                                    <div className="space-y-2">
                                        {results.clubs.map((club: any) => (
                                            <div key={club.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group transition border border-transparent hover:border-gray-200 cursor-default">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                        {club.name[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{club.name}</h4>
                                                        <p className="text-sm text-gray-500 line-clamp-1">{club.description || 'No description'}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => alert('Join functionality coming soon!')}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition opacity-0 group-hover:opacity-100"
                                                >
                                                    Join Club
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Events Section */}
                            {results.events.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 sticky top-0 bg-white pb-2 border-b border-gray-100">Events</h3>
                                    <div className="space-y-2">
                                        {results.events.map((event: any) => (
                                            <div key={event.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group transition border border-transparent hover:border-gray-200 cursor-default">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600 font-bold shrink-0">
                                                        {event.title[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                                                        <p className="text-sm text-gray-500 line-clamp-1">{event.description || 'No description'}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => alert('Join functionality coming soon!')}
                                                    className="px-3 py-1.5 bg-pink-50 text-pink-600 text-xs font-medium rounded-lg hover:bg-pink-100 transition opacity-0 group-hover:opacity-100"
                                                >
                                                    Join Event
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs flex justify-between px-6 text-gray-400">
                    <span>Search global ecosystem</span>
                    <div className="flex gap-4">
                        <span>Navigate <span className="font-mono bg-gray-200 rounded px-1 text-gray-600">↑↓</span></span>
                        <span>Select <span className="font-mono bg-gray-200 rounded px-1 text-gray-600">↵</span></span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchModal

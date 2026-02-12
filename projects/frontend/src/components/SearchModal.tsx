import React, { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import ThreeDotLoader from './ThreeDotLoader'
import { useWallet } from '@txnlab/use-wallet-react'
import { createPaymentTransaction, waitForConfirmation } from '../utils/algorandPayment'
import algosdk from 'algosdk'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface SearchModalProps {
    isOpen: boolean
    onClose: () => void
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<{ clubs: any[], events: any[] }>({ clubs: [], events: [] })
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const { activeAddress, signTransactions, wallets } = useWallet()
    const queryClient = useQueryClient()

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

    const handleJoinClub = async (clubId: string, clubName: string) => {
        setActionLoading(clubId)
        try {
            const message = prompt(`Why do you want to join "${clubName}"? (Optional)`)

            const response = await axios.post(
                `${API_URL}/api/join-requests/club/${clubId}`,
                { message: message || '' },
                { withCredentials: true }
            )

            if (response.data.success) {
                alert('✅ Join request sent! The club owner will review your request.')
                handleSearch(query)
                queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                queryClient.invalidateQueries({ queryKey: ['notifications'] })
            }
        } catch (error: any) {
            console.error('Join club error:', error)
            const errorMsg = error.response?.data?.message || 'Failed to send join request'
            alert('❌ ' + errorMsg)
        } finally {
            setActionLoading(null)
        }
    }

    const handleJoinEvent = async (event: any) => {
        setActionLoading(event.id)
        try {
            // Check if event requires payment
            const detailsResponse = await axios.get(
                `${API_URL}/api/payments/event/${event.id}/details`,
                { withCredentials: true }
            )

            const { alreadyPaid, alreadyMember, event: eventDetails } = detailsResponse.data

            // If already has access
            if (alreadyPaid || alreadyMember) {
                alert('✅ You already have access to this event!')
                setActionLoading(null)
                return
            }

            // If event requires payment
            if (eventDetails.ticketPrice && eventDetails.ticketPrice > 0) {
                // Check if wallet connected
                if (!activeAddress) {
                    const connectNow = confirm('⚠️ You need to connect your wallet to buy tickets.\n\nDo you want to connect Pera Wallet now?')
                    if (connectNow) {
                        const peraWallet = wallets?.find((w: any) => w.metadata.name === 'Pera Wallet' || w.id === 'pera')
                        if (peraWallet) {
                            try {
                                await peraWallet.connect()
                            } catch (err) {
                                console.error('Failed to connect wallet:', err)
                            }
                        } else {
                            alert('Pera Wallet not found. Please connect manually from the dashboard.')
                        }
                    }
                    setActionLoading(null)
                    return
                }

                const confirmed = confirm(
                    `This event requires a ticket purchase of ${eventDetails.ticketPrice} ALGO.\n\n` +
                    `Do you want to proceed with the payment?`
                )

                if (!confirmed) {
                    setActionLoading(null)
                    return
                }

                // Process payment
                try {
                    // Create transaction
                    const txn = await createPaymentTransaction(
                        activeAddress,
                        eventDetails.walletAddress,
                        eventDetails.ticketPrice,
                        `Ticket: ${eventDetails.title}`
                    )

                    // Sign with Pera Wallet
                    const encodedTxn = algosdk.encodeUnsignedTransaction(txn)
                    const signedTxns = await signTransactions([encodedTxn])

                    // Filter out null values and validate
                    const validSignedTxns = signedTxns.filter((txn): txn is Uint8Array => txn !== null)

                    if (validSignedTxns.length === 0) {
                        throw new Error('Transaction signing failed - no valid signed transactions')
                    }

                    // Send transaction using algod client
                    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
                    const { txid } = await algodClient.sendRawTransaction(validSignedTxns[0]).do()

                    alert('⏳ Transaction sent! Waiting for confirmation...')

                    // Wait for confirmation
                    await waitForConfirmation(txid)

                    // Verify on backend
                    const verifyResponse = await axios.post(
                        `${API_URL}/api/payments/event/${event.id}/verify`,
                        {
                            transactionId: txid,
                            walletAddress: activeAddress
                        },
                        { withCredentials: true }
                    )

                    if (verifyResponse.data.success) {
                        alert('🎉 Payment successful! You now have access to the event!')
                        handleSearch(query)
                        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                        queryClient.invalidateQueries({ queryKey: ['notifications'] })
                    } else {
                        alert('❌ Payment verification failed. Please contact support.')
                    }
                } catch (paymentError: any) {
                    console.error('Payment error:', paymentError)
                    alert('❌ Payment failed: ' + (paymentError.message || 'Unknown error'))
                }
            } else {
                // Free event - join directly
                try {
                    const joinResponse = await axios.post(
                        `${API_URL}/api/payments/event/${event.id}/join-free`,
                        {},
                        { withCredentials: true }
                    )

                    if (joinResponse.data.success) {
                        alert('🎉 Successfully joined the event!')
                        handleSearch(query)
                        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                        queryClient.invalidateQueries({ queryKey: ['notifications'] })
                    }
                } catch (joinError: any) {
                    console.error('Join error:', joinError)
                    const errorMsg = joinError.response?.data?.message || 'Failed to join event'
                    alert('❌ ' + errorMsg)
                }
            }

        } catch (error: any) {
            console.error('Join event error:', error)
            const errorMsg = error.response?.data?.message || 'Failed to join event'
            alert('❌ ' + errorMsg)
        } finally {
            setActionLoading(null)
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
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                        {club.name[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-medium text-gray-900">{club.name}</h4>
                                                        <p className="text-sm text-gray-500 line-clamp-1">{club.description || 'No description'}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleJoinClub(club.id, club.name)}
                                                    disabled={actionLoading === club.id}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                >
                                                    {actionLoading === club.id ? 'Sending...' : 'Request to Join'}
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
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600 font-bold shrink-0">
                                                        {event.title[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                                                        <p className="text-sm text-gray-500 line-clamp-1">{event.description || 'No description'}</p>
                                                        {event.ticket_price && event.ticket_price > 0 && (
                                                            <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                                                                💰 {event.ticket_price} ALGO
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleJoinEvent(event)}
                                                    disabled={actionLoading === event.id}
                                                    className="px-3 py-1.5 bg-pink-50 text-pink-600 text-xs font-medium rounded-lg hover:bg-pink-100 transition opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                >
                                                    {actionLoading === event.id ? 'Processing...' : (event.ticket_price && event.ticket_price > 0) ? `Buy Ticket` : 'Join Event'}
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

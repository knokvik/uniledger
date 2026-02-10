import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Fix permissions for club/event owners
 * Adds owners to club_members and event_members tables
 */
async function fixPermissions() {
    console.log('🔧 Fixing owner permissions...')

    // Check env
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('❌ Error: Supabase credentials not found!')
        console.log('Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env')
        process.exit(1)
    }

    // Create Supabase client with SERVICE OLE KEY to bypass RLS
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    try {
        // 1. Fix Club Owners
        console.log('\n🏢 Processing clubs...')
        const { data: clubs, error: clubsError } = await supabase
            .from('clubs')
            .select('id, name, owner_id')
            .not('owner_id', 'is', null)

        if (clubsError) {
            console.error('❌ Error fetching clubs:', clubsError.message)
        } else {
            let clubUpdates = 0
            for (const club of clubs) {
                // Check if owner is in members
                const { data: member } = await supabase
                    .from('club_members')
                    .select('role')
                    .eq('club_id', club.id)
                    .eq('user_id', club.owner_id)
                    .single()

                if (!member) {
                    // Add owner
                    const { error } = await supabase
                        .from('club_members')
                        .insert({
                            club_id: club.id,
                            user_id: club.owner_id,
                            role: 'owner'
                        })

                    if (error) console.error(`  ❌ Failed to add owner for "${club.name}":`, error.message)
                    else {
                        console.log(`  ✅ Added owner permissions for "${club.name}"`)
                        clubUpdates++
                    }
                } else if (member.role !== 'owner') {
                    // Update role
                    const { error } = await supabase
                        .from('club_members')
                        .update({ role: 'owner' })
                        .eq('club_id', club.id)
                        .eq('user_id', club.owner_id)

                    if (error) console.error(`  ❌ Failed to update owner role for "${club.name}":`, error.message)
                    else {
                        console.log(`  ✅ Updated owner role for "${club.name}"`)
                        clubUpdates++
                    }
                }
            }
            console.log(`  ✨ Updated ${clubUpdates} clubs`)
        }

        // 2. Fix Event Owners
        console.log('\n📅 Processing events...')
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, title, owner_id')
            .not('owner_id', 'is', null)

        if (eventsError) {
            console.error('❌ Error fetching events:', eventsError.message)
        } else {
            let eventUpdates = 0
            for (const event of events) {
                // Check if owner is in members
                const { data: member } = await supabase
                    .from('event_members')
                    .select('role')
                    .eq('event_id', event.id)
                    .eq('user_id', event.owner_id)
                    .single()

                if (!member) {
                    // Add owner
                    const { error } = await supabase
                        .from('event_members')
                        .insert({
                            event_id: event.id,
                            user_id: event.owner_id,
                            role: 'owner'
                        })

                    if (error) console.error(`  ❌ Failed to add owner for "${event.title}":`, error.message)
                    else {
                        console.log(`  ✅ Added owner permissions for "${event.title}"`)
                        eventUpdates++
                    }
                } else if (member.role !== 'owner') {
                    // Update role
                    const { error } = await supabase
                        .from('event_members')
                        .update({ role: 'owner' })
                        .eq('event_id', event.id)
                        .eq('user_id', event.owner_id)

                    if (error) console.error(`  ❌ Failed to update owner role for "${event.title}":`, error.message)
                    else {
                        console.log(`  ✅ Updated owner role for "${event.title}"`)
                        eventUpdates++
                    }
                }
            }
            console.log(`  ✨ Updated ${eventUpdates} events`)
        }

    } catch (error) {
        console.error('💥 Script failed:', error)
    }
}

fixPermissions()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })

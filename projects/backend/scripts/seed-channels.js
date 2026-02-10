import { supabase } from '../config/supabase.js'

/**
 * Seed default channels for existing clubs and events
 * Run this after creating the schema to add channels to existing clubs/events
 */
async function seedChannels() {
    console.log('🌱 Starting channel seeding...\n')

    try {
        // Get all clubs
        const { data: clubs, error: clubsError } = await supabase
            .from('clubs')
            .select('id, name, owner_id')

        if (clubsError) {
            console.error('❌ Error fetching clubs:', clubsError.message)
            return
        }

        console.log(`📊 Found ${clubs?.length || 0} clubs`)

        // Get all events
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, title, owner_id')

        if (eventsError) {
            console.error('❌ Error fetching events:', eventsError.message)
            return
        }

        console.log(`📊 Found ${events?.length || 0} events\n`)

        // Default channels template
        const defaultChannels = [
            { name: 'general', description: 'General discussion', visibility: 'public' },
            { name: 'announcements', description: 'Important announcements', visibility: 'public' },
            { name: 'volunteers', description: 'Volunteer coordination', visibility: 'volunteer' }
        ]

        let totalCreated = 0

        // Create channels for each club
        if (clubs && clubs.length > 0) {
            console.log('🏢 Creating channels for clubs...')

            for (const club of clubs) {
                // Check if club already has channels
                const { data: existingChannels } = await supabase
                    .from('channels')
                    .select('id')
                    .eq('club_id', club.id)

                if (existingChannels && existingChannels.length > 0) {
                    console.log(`  ⏭️  Club "${club.name}" already has ${existingChannels.length} channels, skipping`)
                    continue
                }

                // Create channels for this club
                const channelsToInsert = defaultChannels.map(ch => ({
                    ...ch,
                    club_id: club.id,
                    created_by: club.owner_id
                }))

                const { data: createdChannels, error: channelError } = await supabase
                    .from('channels')
                    .insert(channelsToInsert)
                    .select()

                if (channelError) {
                    console.error(`  ❌ Error creating channels for club "${club.name}":`, channelError.message)
                } else {
                    console.log(`  ✅ Created ${createdChannels.length} channels for club "${club.name}"`)
                    totalCreated += createdChannels.length
                }
            }
        }

        // Create channels for each event
        if (events && events.length > 0) {
            console.log('\n📅 Creating channels for events...')

            for (const event of events) {
                // Check if event already has channels
                const { data: existingChannels } = await supabase
                    .from('channels')
                    .select('id')
                    .eq('event_id', event.id)

                if (existingChannels && existingChannels.length > 0) {
                    console.log(`  ⏭️  Event "${event.title}" already has ${existingChannels.length} channels, skipping`)
                    continue
                }

                // Create channels for this event
                const channelsToInsert = defaultChannels.map(ch => ({
                    ...ch,
                    event_id: event.id,
                    created_by: event.owner_id
                }))

                const { data: createdChannels, error: channelError } = await supabase
                    .from('channels')
                    .insert(channelsToInsert)
                    .select()

                if (channelError) {
                    console.error(`  ❌ Error creating channels for event "${event.title}":`, channelError.message)
                } else {
                    console.log(`  ✅ Created ${createdChannels.length} channels for event "${event.title}"`)
                    totalCreated += createdChannels.length
                }
            }
        }

        console.log('\n' + '='.repeat(50))
        console.log(`🎉 Seeding complete! Created ${totalCreated} channels total`)
        console.log('='.repeat(50))

    } catch (error) {
        console.error('💥 Seeding failed:', error)
        process.exit(1)
    }
}

// Check if Supabase is configured
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Supabase credentials not found!')
    console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file')
    process.exit(1)
}

// Run seeding
seedChannels()
    .then(() => {
        console.log('\n✅ Done!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Error:', error)
        process.exit(1)
    })

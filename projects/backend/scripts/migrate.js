import { supabase } from '../config/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Run database migrations
 * This script will create/update the database schema in Supabase
 */
async function runMigrations() {
    try {
        console.log('🚀 Starting database migration...')
        console.log('📂 Reading schema.sql file...')

        // Read the schema file
        const schemaPath = path.join(__dirname, '../schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf8')

        console.log('✅ Schema file loaded successfully')
        console.log('📊 Executing SQL statements...')

        // Split the schema into individual statements
        // We need to execute them one by one for better error handling
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))

        console.log(`📝 Found ${statements.length} SQL statements to execute`)

        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';'

            // Skip comments
            if (statement.trim().startsWith('--')) {
                continue
            }

            try {
                const { error } = await supabase.rpc('exec_sql', { sql: statement })

                if (error) {
                    // Check if it's a "already exists" error (which is okay)
                    if (error.message.includes('already exists')) {
                        console.log(`⚠️  Statement ${i + 1}: Already exists (skipping)`)
                        successCount++
                    } else {
                        console.error(`❌ Statement ${i + 1} failed:`, error.message)
                        errorCount++
                    }
                } else {
                    console.log(`✅ Statement ${i + 1}: Success`)
                    successCount++
                }
            } catch (err) {
                console.error(`❌ Statement ${i + 1} error:`, err.message)
                errorCount++
            }
        }

        console.log('\n' + '='.repeat(50))
        console.log('📊 Migration Summary:')
        console.log(`✅ Successful: ${successCount}`)
        console.log(`❌ Failed: ${errorCount}`)
        console.log('='.repeat(50))

        if (errorCount === 0) {
            console.log('\n🎉 Migration completed successfully!')
        } else {
            console.log('\n⚠️  Migration completed with some errors. Please review the logs above.')
        }

        // Verify tables were created
        console.log('\n🔍 Verifying tables...')
        await verifyTables()

    } catch (error) {
        console.error('💥 Migration failed:', error)
        process.exit(1)
    }
}

/**
 * Verify that all required tables exist
 */
async function verifyTables() {
    const requiredTables = [
        'clubs',
        'events',
        'club_members',
        'event_members',
        'channels',
        'messages'
    ]

    console.log('📋 Checking for required tables...')

    for (const table of requiredTables) {
        try {
            const { error } = await supabase.from(table).select('*').limit(0)

            if (error) {
                console.log(`❌ Table '${table}' not found or not accessible`)
            } else {
                console.log(`✅ Table '${table}' exists and is accessible`)
            }
        } catch (err) {
            console.log(`❌ Error checking table '${table}':`, err.message)
        }
    }

    console.log('\n✨ Verification complete!')
}

/**
 * Alternative method: Execute the entire schema as one statement
 * Use this if the RPC method doesn't work
 */
async function runMigrationsAlternative() {
    try {
        console.log('🚀 Starting database migration (alternative method)...')
        console.log('📂 Reading schema.sql file...')

        const schemaPath = path.join(__dirname, '../schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf8')

        console.log('✅ Schema file loaded successfully')
        console.log('📊 Executing schema...')

        // Try to execute the entire schema
        const { error } = await supabase.rpc('exec_sql', { sql: schema })

        if (error) {
            console.error('❌ Migration failed:', error)
            console.log('\n💡 Tip: You may need to run this schema manually in Supabase SQL Editor')
            console.log('📍 Location: Supabase Dashboard > SQL Editor > New Query')
            console.log('\n📄 Copy the contents of schema.sql and paste it there.')
        } else {
            console.log('✅ Migration completed successfully!')
        }

        await verifyTables()

    } catch (error) {
        console.error('💥 Migration failed:', error)
        console.log('\n💡 Manual Migration Instructions:')
        console.log('1. Go to Supabase Dashboard')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Click "New Query"')
        console.log('4. Copy the contents of backend/schema.sql')
        console.log('5. Paste and run the query')
    }
}

// Run migrations
console.log('🎯 UniLedger Database Migration Tool\n')

// Check if Supabase is configured
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Supabase credentials not found!')
    console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file')
    process.exit(1)
}

// Run the migration
runMigrationsAlternative()
    .then(() => {
        console.log('\n✅ Done!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Error:', error)
        process.exit(1)
    })

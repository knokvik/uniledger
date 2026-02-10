import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Simple migration script that applies schema.sql to Supabase
 * This uses the Supabase service role key for admin access
 */
async function migrate() {
    console.log('🎯 UniLedger Database Migration\n')

    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('❌ Error: Missing Supabase credentials!')
        console.log('\n📝 Please add to your .env file:')
        console.log('SUPABASE_URL=your_supabase_url')
        console.log('SUPABASE_SERVICE_KEY=your_service_role_key')
        console.log('\n💡 Find these in: Supabase Dashboard > Settings > API')
        process.exit(1)
    }

    // Create Supabase client with service role
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
        console.log('📂 Reading schema.sql...')
        const schemaPath = path.join(__dirname, '../schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf8')
        console.log('✅ Schema loaded\n')

        console.log('📊 Applying schema to Supabase...')
        console.log('⏳ This may take a moment...\n')

        // Note: Supabase client doesn't directly support raw SQL execution
        // We need to use the REST API or SQL Editor
        console.log('⚠️  Direct SQL execution via client is not supported.')
        console.log('\n📋 Manual Migration Steps:')
        console.log('━'.repeat(60))
        console.log('1. Open Supabase Dashboard: https://app.supabase.com')
        console.log('2. Select your project')
        console.log('3. Go to: SQL Editor (left sidebar)')
        console.log('4. Click: "New Query"')
        console.log('5. Copy the entire contents of: backend/schema.sql')
        console.log('6. Paste into the SQL Editor')
        console.log('7. Click: "Run" (or press Cmd/Ctrl + Enter)')
        console.log('━'.repeat(60))

        console.log('\n📄 Schema file location:')
        console.log(`   ${schemaPath}`)

        console.log('\n💡 Tip: The schema uses "CREATE TABLE IF NOT EXISTS"')
        console.log('   so it\'s safe to run multiple times!')

        // Verify connection
        console.log('\n🔍 Verifying Supabase connection...')
        const { data, error } = await supabase.from('users').select('count').limit(1)

        if (error && !error.message.includes('does not exist')) {
            console.error('❌ Connection failed:', error.message)
        } else {
            console.log('✅ Supabase connection successful!')
        }

    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
}

// Run migration
migrate()

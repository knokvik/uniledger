import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const schemaPath = path.join(__dirname, '../schema.sql');

if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is missing.');
    console.error('Make sure your .env file contains the connection string (e.g., postgres://postgres:password@db.supabase.co:5432/postgres)');
    process.exit(1);
}

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase (usually)
});

async function deploySchema() {
    try {
        console.log('🔌 Connecting to database...');
        await client.connect();

        console.log('📄 Reading schema.sql...');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🚀 Executing schema...');
        // Split by semicolon? No, pg usually handles entire script if simple.
        // Or executing one big query.
        await client.query(sql);

        console.log('✅ Schema deployed successfully!');
    } catch (error) {
        console.error('❌ Error deploying schema:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

deploySchema();

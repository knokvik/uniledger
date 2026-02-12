
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const deploy = async () => {
    try {
        console.log('🔌 Connecting to database...');
        await client.connect();

        const schemaPath = path.join(__dirname, '../migrations/add_creation_requests.sql');
        console.log(`📄 Reading ${schemaPath}...`);
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('🚀 Executing migration...');
        await client.query(schema);

        console.log('✅ Creation Requests Tables created successfully!');
    } catch (error) {
        console.error('❌ Error deploying migration:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
};

deploy();

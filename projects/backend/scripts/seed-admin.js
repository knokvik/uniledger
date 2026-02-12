import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY; // or SERVICE_ROLE_KEY if RLS is on

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
    const email = 'neerajnaphade02@gmail.com';
    const password = 'admin';
    const name = 'Neeraj Naphade (Admin)';

    console.log(`👤 Seeding Admin User: ${email}`);

    try {
        // Check if exists
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();

        if (existing) {
            console.log('⚠️ Admin user already exists.');
            // Update role just in case
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: 'college_admin' })
                .eq('email', email);

            if (updateError) console.error('Failed to update role:', updateError);
            else console.log('✅ Ensure role is college_admin');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('users')
            .insert({
                email,
                password: hashedPassword,
                name,
                role: 'college_admin'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log('✅ Admin user created successfully!');
        console.log(`EMAIL: ${email}`);
        console.log(`PASSWORD: ${password}`);
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    }
}

seedAdmin();

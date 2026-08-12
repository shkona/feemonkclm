import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
let SUPABASE_URL, SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      SUPABASE_URL = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      SUPABASE_ANON_KEY = line.split('=')[1].trim();
    }
  }
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error(`   VITE_SUPABASE_URL: ${SUPABASE_URL ? '✅' : '❌'}`);
  console.error(`   VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function importVisits() {
  try {
    console.log('🔍 Finding Ankith in users table...');
    
    // Get Ankith's user ID
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('name', 'Ankith')
      .single();

    if (userError) {
      console.error('❌ Could not find Ankith:', userError.message);
      process.exit(1);
    }

    const ankithId = users.id;
    console.log(`✅ Found Ankith: ${ankithId}`);

    // Read visits data
    const visitsData = JSON.parse(fs.readFileSync('./visits_import.json', 'utf8'));
    console.log(`\n📊 Preparing to import ${visitsData.length} visits...`);

    // Add created_by field to each visit
    const visitsWithUser = visitsData.map(visit => ({
      ...visit,
      created_by: ankithId
    }));

    // Insert visits in batches (100 at a time to avoid timeouts)
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < visitsWithUser.length; i += batchSize) {
      const batch = visitsWithUser.slice(i, i + batchSize);
      console.log(`\n📤 Importing batch ${Math.floor(i / batchSize) + 1} (${batch.length} visits)...`);

      const { data, error } = await supabase
        .from('visits')
        .insert(batch);

      if (error) {
        console.error(`❌ Error importing batch: ${error.message}`);
        errorCount += batch.length;
      } else {
        console.log(`✅ Successfully imported ${batch.length} visits`);
        successCount += batch.length;
      }
    }

    console.log(`\n🎉 Import Complete!`);
    console.log(`✅ Successful: ${successCount} visits`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} visits`);
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

importVisits();
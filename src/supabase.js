import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pvafylzqrawbdhlmdecg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YWZ5bHpxcmF3YmRobG1kZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDc4NzEsImV4cCI6MjA5MzQ4Mzg3MX0.fdXtENeLs3QY__NkCVbseCHNWXnYdAVIIcuJz8ZOhEk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://muqwxfolynitrxwkrvvh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cXd4Zm9seW5pdHJ4d2tydnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1OTgwMTgsImV4cCI6MjA2MDE3NDAxOH0.S_w8Eg_SdG01EnYYH-G_AgjhHjPPg_yQ30CyQX47cO8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTokens() {
  const { data, error } = await supabase
    .from('t_profiles')
    .select('id_profile, nm_full_name, nm_email, dc_fcm_token');

  console.log('Perfis no banco:', JSON.stringify(data, null, 2));
  if (error) console.error('Erro:', error);
}

checkTokens();

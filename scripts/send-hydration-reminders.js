/**
 * Script de Envio de Lembretes de Hidratação via Firebase Cloud Messaging
 * Executado diariamente às 14:00 e às 17:00 para usuários com 0ml consumidos no dia.
 */
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

// 1. Inicializar Supabase Admin
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://muqwxfolynitrxwkrvvh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY é obrigatória.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 2. Inicializar Firebase Admin (usando serviceAccount ou variáveis de ambiente)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'aquahabit-web'
  });
}

async function sendReminders() {
  console.log('💧 [CRON] Verificando usuários que ainda não beberam água hoje...');

  // Obter data atual no formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Buscar perfis com FCM token ativo
  const { data: profiles, error: profileError } = await supabase
    .from('t_profiles')
    .select('id_profile, nm_full_name, dc_fcm_token, fl_reminder_enabled')
    .not('dc_fcm_token', 'is', null)
    .eq('fl_reminder_enabled', true);

  if (profileError || !profiles) {
    console.error('Erro ao buscar perfis:', profileError);
    return;
  }

  console.log(`Encontrados ${profiles.length} usuários com notificações ativas.`);

  for (const profile of profiles) {
    // Verificar se o usuário já registrou consumo hoje
    const { data: dailyLog } = await supabase
      .from('t_daily_logs')
      .select('qt_intake_ml')
      .eq('id_user', profile.id_profile)
      .eq('dt_log', today)
      .maybeSingle();

    const intake = dailyLog?.qt_intake_ml || 0;

    if (intake === 0 && profile.dc_fcm_token) {
      console.log(`Enviando lembrete para ${profile.nm_full_name || profile.id_profile}...`);
      
      const message = {
        token: profile.dc_fcm_token,
        notification: {
          title: 'Hora de se hidratar! 💧',
          body: `Olá ${profile.nm_full_name ? profile.nm_full_name.split(' ')[0] : ''}! Você ainda não registrou água hoje. Beba um copo agora para manter seu foco e saúde!`,
        },
        data: {
          url: 'https://aquahabit.vercel.app'
        }
      };

      try {
        await admin.messaging().send(message);
        console.log(`✅ Lembrete enviado com sucesso para ${profile.nm_full_name}!`);
      } catch (fcmErr) {
        console.error(`Erro ao enviar FCM para ${profile.id_profile}:`, fcmErr);
      }
    }
  }

  console.log('🏁 [CRON] Execução concluída.');
}

sendReminders().catch(console.error);

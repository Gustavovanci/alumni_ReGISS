import { createClient } from '@supabase/supabase-js'

// O Vite usa import.meta.env para ler as variáveis que colocamos no arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase no arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // [FIX ANDROID/PWA] Trocando para v3 e desabilitando o LockManager nativo
    // para evitar o erro "Acquiring an exclusive Navigator LockManager Lock timeout"
    storageKey: 'alumnihc-auth-token-v3',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // [NO-OP LOCK] Desativa a trava de abas que buga no Android WebView
    // Versão ultra-robusta: busca o callback de aquisição em qualquer argumento
    lock: (...args: any[]) => {
      const acquire = args.find(a => typeof a === 'function');
      return acquire ? acquire() : Promise.resolve();
    }
  }
})
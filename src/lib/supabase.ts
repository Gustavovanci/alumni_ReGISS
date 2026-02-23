import { createClient } from '@supabase/supabase-js'

// O Vite usa import.meta.env para ler as variáveis que colocamos no arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase no arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Trocando a chave de armazenamento força o navegador a abandonar as 
    // travas "LockManager" antigas presas pelo Hot Reload do React (HMR)
    storageKey: 'alumnihc-auth-token-v2',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
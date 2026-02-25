import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface StoreState {
    // 1. Cache do Usuário
    userProfile: any | null;
    setUserProfile: (profile: any) => void;
    fetchUserProfile: () => Promise<void>;

    // 2. Cache da Rede (Para Comunidades e Network)
    allProfiles: any[];
    fetchAllProfiles: () => Promise<void>;

    // 3. Cache de Posts do Feed (Para não recarregar a tela inteira sempre)
    feedPosts: any[];
    setFeedPosts: (posts: any[]) => void;
    fetchInitialFeed: () => Promise<void>;

    // 4. Status Global de Loading Inicial
    isGlobalLoading: boolean;
}

export const useStore = create<StoreState>((set, get) => ({
    userProfile: null,
    setUserProfile: (profile) => set({ userProfile: profile }),

    fetchUserProfile: async () => {
        // Se já temos o perfil, não gasta rede
        if (get().userProfile) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) {
                set({ userProfile: { ...data, uid: user.id } });
            }
        }
    },

    allProfiles: [],
    fetchAllProfiles: async () => {
        // Se já tem cache, não busca de novo (Mata o 'Vilão da Amnésia')
        if (get().allProfiles.length > 0) return;

        // TODO: Num app bilionário, isso aqui teria paginação. Mas pro MVP beta, .limit(1000) salva do colapso
        const { data } = await supabase.from('profiles').select('id, full_name, profession, entry_year, role, avatar_url, job_title').limit(1500);
        if (data) {
            set({ allProfiles: data });
        }
    },

    feedPosts: [],
    setFeedPosts: (posts) => set({ feedPosts: posts }),
    fetchInitialFeed: async () => {
        // Vilão da Gula morto: Limit(20) garante carregamento leve
        if (get().feedPosts.length > 0) return; // Se já desceu o feed, mantém cache

        const { data } = await supabase
            .from('posts')
            .select(`
        *,
        profiles (
          full_name, profession, entry_year, job_title, avatar_url, role
        )
      `)
            .eq('type', 'general')
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            set({ feedPosts: data });
        }
    },

    isGlobalLoading: false
}));

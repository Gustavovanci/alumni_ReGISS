import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface StoreState {
    currentUser: any | null;
    userRole: string | null;
    isAuthReady: boolean;
    setAuthState: (user: any | null, role: string | null) => void;

    userProfile: any | null;
    setUserProfile: (profile: any) => void;
    fetchUserProfile: (force?: boolean) => Promise<void>;

    allProfiles: any[];
    fetchAllProfiles: () => Promise<void>;

    feedPosts: any[];
    setFeedPosts: (posts: any[]) => void;
    fetchInitialFeed: () => Promise<void>;

    isGlobalLoading: boolean;
}

export const useStore = create<StoreState>((set, get) => ({
    currentUser: null,
    userRole: null,
    isAuthReady: false,
    setAuthState: (user, role) => set({ currentUser: user, userRole: role, isAuthReady: true }),

    userProfile: null,
    setUserProfile: (profile) => set({ userProfile: profile }),

    fetchUserProfile: async (force = false) => {
        if (get().userProfile && !force) return;

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
        if (get().allProfiles.length > 0) return;
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, profession, entry_year, role, avatar_url, job_title')
            .limit(1500);
        if (data) set({ allProfiles: data });
    },

    feedPosts: [],
    setFeedPosts: (posts) => set({ feedPosts: posts }),
    fetchInitialFeed: async () => {
        if (get().feedPosts.length > 0) return;
        const { data } = await supabase
            .from('posts')
            .select('*, profiles(full_name, profession, entry_year, job_title, avatar_url, role)')
            .eq('type', 'general')
            .order('created_at', { ascending: false })
            .limit(20);
        if (data) set({ feedPosts: data });
    },

    isGlobalLoading: false,
}));
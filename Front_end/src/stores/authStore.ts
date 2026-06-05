import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'faculty' | 'admin';
  avatar_url: string | null;
  phone: string | null;
  institution: string | null;
  department: string | null;
  bio: string | null;
  skills: string[];
  social_links: Record<string, string>;
  streak: number;
  created_at: string;
  updated_at: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, full_name: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  _setupAuthListener: () => void;
}

// Function to fetch the extended profile
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return data as UserProfile;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) throw authError;

          if (authData.session && authData.user) {
            const profile = await fetchUserProfile(authData.user.id);
            set({
              user: profile,
              session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                expires_at: authData.session.expires_at || 0,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
             set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email: string, password: string, full_name: string, role = 'student') => {
        set({ isLoading: true });
        try {
          // 1. Create auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error('User creation failed');

          // 2. Create profile in users table
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email,
              full_name,
              role,
              skills: [],
              social_links: {},
              streak: 0,
            })
            .select()
            .single();

          if (profileError) throw profileError;

          // 3. Set session
          if (authData.session) {
            set({
              user: profileData as UserProfile,
              session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                expires_at: authData.session.expires_at || 0,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
             set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error("Sign out error", error);
        } finally {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkSession: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (!session) {
            set({ isAuthenticated: false, user: null, session: null });
            return;
          }

          const profile = await fetchUserProfile(session.user.id);
          
          set({
            user: profile,
            session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at || 0,
            },
            isAuthenticated: true,
          });
        } catch (e) {
          set({ isAuthenticated: false, user: null, session: null });
        }
      },

      updateUser: (updates: Partial<UserProfile>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
      
      _setupAuthListener: () => {
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT') {
            set({ user: null, session: null, isAuthenticated: false });
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
             if (session) {
               const currentUser = get().user;
               if (!currentUser || currentUser.id !== session.user.id) {
                 const profile = await fetchUserProfile(session.user.id);
                 set({
                   user: profile,
                   session: {
                     access_token: session.access_token,
                     refresh_token: session.refresh_token,
                     expires_at: session.expires_at || 0,
                   },
                   isAuthenticated: true,
                 });
               } else {
                 set({
                   session: {
                     access_token: session.access_token,
                     refresh_token: session.refresh_token,
                     expires_at: session.expires_at || 0,
                   },
                 });
               }
             }
          }
        });
      }
    }),
    {
      name: 'placementor-auth',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize the auth listener immediately
useAuthStore.getState()._setupAuthListener();

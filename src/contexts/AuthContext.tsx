
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string, persistSession?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  waterGoal: number;
  setWaterGoal: (goal: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [waterGoal, setWaterGoalState] = useState(3000);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlocks
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("AuthContext: Fetching profile for", userId);
      
      // Always select updated_at to support proper sorting
      const result = await supabase
        .from('profiles')
        .select('water_goal, phone_number, reminder_method, reminders_enabled, updated_at')
        .eq('user_id', userId);

      console.log("AuthContext profile fetch result:", result);
      
      if (result.error) {
        console.error('Error fetching profile:', result.error);
        return;
      }

      // Handle the case where multiple profiles might exist (taking the most recent one)
      if (result.data && result.data.length > 0) {
        // If we have multiple profiles, sort by updated_at if it exists
        let profile = result.data[0];
        
        if (result.data.length > 1) {
          // Sort by updated_at in descending order if it exists (most recent first)
          const sorted = result.data.filter(p => p.updated_at !== null)
            .sort((a, b) => {
              if (!a.updated_at || !b.updated_at) return 0;
              return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            });
          
          // Use the sorted profile if available, otherwise use the first one
          if (sorted.length > 0) {
            profile = sorted[0];
          }
        }
        
        console.log("AuthContext: Found profile:", profile);
        
        if (profile.water_goal) {
          setWaterGoalState(profile.water_goal);
        }
        
        // Log important phone number information for debugging
        console.log("Phone number in profile:", profile.phone_number);
        console.log("Reminder method:", profile.reminder_method);
        console.log("Reminders enabled:", profile.reminders_enabled);
      } else {
        console.log("AuthContext: No profile found for user", userId);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const setWaterGoal = async (goal: number) => {
    if (!user) return;

    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({ water_goal: goal })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([{ user_id: user.id, water_goal: goal }]);

        if (error) throw error;
      }

      setWaterGoalState(goal);
      toast.success("Water goal updated successfully");
    } catch (error) {
      console.error('Error setting water goal:', error);
      toast.error("Failed to update water goal");
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        }
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').insert([{ 
          user_id: data.user.id, 
          water_goal: 3000,
          display_name: name,
          email: email,
          preferences: {} 
        }]);
        
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || "Failed to sign up");
      throw error;
    }
  };

  const signIn = async (email: string, password: string, persistSession: boolean = false) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Set the session persistence based on user preference
      if (!persistSession) {
        // If user doesn't want to persist session, we'll set auto refresh token to false
        // This doesn't directly modify the current authentication, but affects future behavior
        supabase.auth.setSession({
          access_token: session?.access_token || '',
          refresh_token: session?.refresh_token || '',
        });
      }
      
      toast.success("Logged in successfully!");
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error(error.message || "Failed to log out");
    }
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    waterGoal,
    setWaterGoal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

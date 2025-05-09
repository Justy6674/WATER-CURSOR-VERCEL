
// Simple standalone types without importing from supabase types
// This avoids the duplicate Database identifier issue

export interface ProfilesRow {
  id: number;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone_number: string | null;
  reminder_method: "sms" | "whatsapp" | "email" | null;
  reminders_enabled: boolean | null;
  created_at: string | null;
  water_goal: number | null;
}

// Type utility to extract profiles data from query results
export type ProfileQueryResult = {
  data: ProfilesRow | null;
  error: any;
};

// Simple insertion and update types
export type ProfileInsert = {
  user_id?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  reminder_method?: "sms" | "whatsapp" | "email" | null;
  reminders_enabled?: boolean | null;
  created_at?: string | null;
  water_goal?: number | null;
};

export type ProfileUpdate = ProfileInsert;

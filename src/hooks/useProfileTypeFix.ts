
// TEMPORARY UTILITY HOOK
// This provides a way to properly type profile data using our custom types

import { ProfilesRow } from "@/types/supabase-augmentation";

export function useProfileTypeFix() {
  /**
   * Helper function to properly type profile data retrieved from Supabase
   * This is a temporary solution until proper type regeneration is available
   */
  const fixProfileData = <T extends { data: any; error?: any }>(result: T): T & { data: ProfilesRow | null } => {
    // Handle error cases or null data
    if (!result || result.error || !result.data) return { ...result, data: null } as any;
    
    // If we got multiple profiles for the same user (which shouldn't happen but does),
    // take the most recently updated one
    let profileData = Array.isArray(result.data) ? result.data[0] : result.data;
    
    // If we have an array with multiple rows for the same user_id, sort by updated_at and take the newest
    if (Array.isArray(result.data) && result.data.length > 0) {
      // Sort by updated_at in descending order (newest first)
      const sorted = [...result.data].sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
      profileData = sorted[0];
      console.warn(`Multiple profiles found for user, using most recent one (ID: ${profileData.id})`);
    }
    
    // Ensure we have all the required fields with proper types
    const fixedData: ProfilesRow = {
      id: profileData.id,
      user_id: profileData.user_id,
      display_name: profileData.display_name || null,
      email: profileData.email || null,
      phone_number: profileData.phone_number || null,
      reminder_method: profileData.reminder_method || null,
      reminders_enabled: profileData.reminders_enabled !== undefined ? profileData.reminders_enabled : false,
      created_at: profileData.created_at || null,
      water_goal: profileData.water_goal !== undefined ? profileData.water_goal : null,
    };

    return {
      ...result,
      data: fixedData
    } as any;
  };

  return { fixProfileData };
}

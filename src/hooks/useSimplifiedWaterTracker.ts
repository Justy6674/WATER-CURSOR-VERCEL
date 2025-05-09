import { useState, useEffect, useCallback } from \"react\";
import { supabase } from \"@integrations/supabase/client\";
import { useAuth } from \"@contexts/AuthContext\";
import { toast } from \"sonner\";
import { WaterLogEntry } from \"@types/water.types\";

export const useSimplifiedWaterTracker = () => {
  const { user, waterGoal } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [streak, setStreak ] = useState(0);
  const [completedDays, setCompletedDays ] = useState(0);
  const [history, setHistory ] = useState<WaterLogEntry[]>(();
  const today = new Date().toISOString().split('T')[0];

  // Fetch water data and achievements
  const fetchData = useCallback(async () => {
    if
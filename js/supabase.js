// js/supabase.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://medlghzumbqsnotbmvqk.supabase.co";      
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZGxnaHp1bWJxc25vdGJtdnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzI4MTAsImV4cCI6MjA3NjIwODgxMH0.JZUB4sgPV_LwbKl9kpjDW1aPQ_BxaTbsrCN5aV_Ol5c";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

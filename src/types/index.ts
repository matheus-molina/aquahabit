export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'moderate' | 'intense';
export type BeverageType = 'water' | 'tea' | 'coffee' | 'juice' | 'sports' | 'lemon_water';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  height_cm: number;
  weight_kg: number;
  gender: Gender;
  activity_level: ActivityLevel;
  imc: number;
  imc_classification: string;
  daily_water_target_ml: number;
  reminder_interval_minutes: number;
  reminder_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// Database schema interface for t_profiles
export interface DbProfileRow {
  id_profile: string;
  nm_email?: string;
  nm_full_name?: string;
  dc_avatar_url?: string;
  vl_height_cm: number;
  vl_weight_kg: number;
  dc_gender: Gender;
  dc_activity_level: ActivityLevel;
  vl_imc: number;
  dc_imc_classification: string;
  qt_daily_water_target_ml: number;
  qt_reminder_interval_min: number;
  fl_reminder_enabled: boolean;
  dh_created_at?: string;
  dh_updated_at?: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  intake_ml: number;
  target_ml: number;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

// Database schema interface for t_daily_logs
export interface DbDailyLogRow {
  id_daily_log: string;
  id_user: string;
  dt_log: string;
  qt_intake_ml: number;
  qt_target_ml: number;
  fl_completed: boolean;
  dh_created_at?: string;
  dh_updated_at?: string;
}

export interface WaterEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  amount_ml: number;
  beverage_type: BeverageType;
  created_at: string; // ISO String
}

// Database schema interface for t_water_entries
export interface DbWaterEntryRow {
  id_water_entry: string;
  id_user: string;
  dt_entry: string;
  qt_amount_ml: number;
  dc_beverage_type: BeverageType;
  dh_created_at: string;
}

export interface IMCResult {
  imc: number;
  classification: string;
  color: string;
  description: string;
  minHealthyWeight: number;
  maxHealthyWeight: number;
}

export interface WaterTargetResult {
  targetMl: number;
  baseMultiplier: number;
  activityBonusMl: number;
  recommendation: string;
}

export interface OfflineAction {
  id: string;
  type: 'ADD_ENTRY' | 'DELETE_ENTRY' | 'UPDATE_PROFILE' | 'UPDATE_DAILY_LOG';
  payload: any;
  timestamp: number;
}

export interface DayProgress {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
  intake_ml: number;
  target_ml: number;
  percentage: number;
  completed: boolean;
}

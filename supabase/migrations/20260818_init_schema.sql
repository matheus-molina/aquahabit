-- ==============================================================================
-- AQUAHABIT - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Padrão Corporativo de Nomenclatura: t_ (tabelas), id_, nm_, dc_, vl_, qt_, fl_, dt_, dh_
-- ==============================================================================

-- Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABELA T_PROFILES (Dados corporais, IMC e Meta)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.t_profiles (
    id_profile UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nm_email TEXT,
    nm_full_name TEXT,
    dc_avatar_url TEXT,
    vl_height_cm NUMERIC(5, 2) NOT NULL DEFAULT 170,
    vl_weight_kg NUMERIC(5, 2) NOT NULL DEFAULT 70,
    dc_gender TEXT CHECK (dc_gender IN ('male', 'female', 'other')) DEFAULT 'other',
    dc_activity_level TEXT CHECK (dc_activity_level IN ('sedentary', 'moderate', 'intense')) DEFAULT 'moderate',
    vl_imc NUMERIC(4, 2) NOT NULL DEFAULT 24.22,
    dc_imc_classification TEXT DEFAULT 'Normal',
    qt_daily_water_target_ml INTEGER NOT NULL DEFAULT 2500,
    qt_reminder_interval_min INTEGER DEFAULT 90,
    fl_reminder_enabled BOOLEAN DEFAULT true,
    dh_created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    dh_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. TABELA T_DAILY_LOGS (Resumo consolidado do dia)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.t_daily_logs (
    id_daily_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dt_log DATE NOT NULL,
    qt_intake_ml INTEGER NOT NULL DEFAULT 0,
    qt_target_ml INTEGER NOT NULL DEFAULT 2500,
    fl_completed BOOLEAN NOT NULL DEFAULT false,
    dh_created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    dh_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_daily_log UNIQUE (id_user, dt_log)
);

-- ------------------------------------------------------------------------------
-- 3. TABELA T_WATER_ENTRIES (Cada registro de água individual)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.t_water_entries (
    id_water_entry UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dt_entry DATE NOT NULL,
    qt_amount_ml INTEGER NOT NULL CHECK (qt_amount_ml > 0),
    dc_beverage_type TEXT DEFAULT 'water' CHECK (dc_beverage_type IN ('water', 'tea', 'coffee', 'juice', 'sports', 'lemon_water')),
    dh_created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. ÍNDICES DE ALTA PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_t_daily_logs_user_date ON public.t_daily_logs(id_user, dt_log);
CREATE INDEX IF NOT EXISTS idx_t_water_entries_user_date ON public.t_water_entries(id_user, dt_entry);
CREATE INDEX IF NOT EXISTS idx_t_water_entries_created ON public.t_water_entries(dh_created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.t_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.t_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.t_water_entries ENABLE ROW LEVEL SECURITY;

-- Policies para t_profiles
CREATE POLICY "Users can view own profile"
    ON public.t_profiles FOR SELECT
    USING (auth.uid() = id_profile);

CREATE POLICY "Users can insert own profile"
    ON public.t_profiles FOR INSERT
    WITH CHECK (auth.uid() = id_profile);

CREATE POLICY "Users can update own profile"
    ON public.t_profiles FOR UPDATE
    USING (auth.uid() = id_profile);

-- Policies para t_daily_logs
CREATE POLICY "Users can view own daily logs"
    ON public.t_daily_logs FOR SELECT
    USING (auth.uid() = id_user);

CREATE POLICY "Users can insert own daily logs"
    ON public.t_daily_logs FOR INSERT
    WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can update own daily logs"
    ON public.t_daily_logs FOR UPDATE
    USING (auth.uid() = id_user);

CREATE POLICY "Users can delete own daily logs"
    ON public.t_daily_logs FOR DELETE
    USING (auth.uid() = id_user);

-- Policies para t_water_entries
CREATE POLICY "Users can view own water entries"
    ON public.t_water_entries FOR SELECT
    USING (auth.uid() = id_user);

CREATE POLICY "Users can insert own water entries"
    ON public.t_water_entries FOR INSERT
    WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can update own water entries"
    ON public.t_water_entries FOR UPDATE
    USING (auth.uid() = id_user);

CREATE POLICY "Users can delete own water entries"
    ON public.t_water_entries FOR DELETE
    USING (auth.uid() = id_user);

-- ------------------------------------------------------------------------------
-- 6. TRIGGERS AUTOMÁTICOS
-- ------------------------------------------------------------------------------

-- Função para atualizar dh_updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dh_updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_t_profiles_updated_at
    BEFORE UPDATE ON public.t_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_t_daily_logs_updated_at
    BEFORE UPDATE ON public.t_daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para criar perfil padrão quando novo usuário se autentica
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.t_profiles (
        id_profile,
        nm_email,
        nm_full_name,
        dc_avatar_url,
        vl_height_cm,
        vl_weight_kg,
        vl_imc,
        qt_daily_water_target_ml
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário'),
        NEW.raw_user_meta_data->>'avatar_url',
        170,
        70,
        24.22,
        2450
    )
    ON CONFLICT (id_profile) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
--  OCTAGON PICKS — Schéma Supabase complet
--  À exécuter dans : Supabase > SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (liés à auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leagues
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- League members
CREATE TABLE public.league_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- UFC Events
CREATE TABLE public.ufc_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'locked', 'completed')),
  prediction_deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fights
CREATE TABLE public.fights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.ufc_events(id) ON DELETE CASCADE,
  fighter1_name TEXT NOT NULL,
  fighter2_name TEXT NOT NULL,
  fighter1_record TEXT,
  fighter2_record TEXT,
  weight_class TEXT NOT NULL,
  scheduled_rounds INTEGER NOT NULL DEFAULT 3,
  card_order INTEGER NOT NULL DEFAULT 0,
  is_main_event BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fight results (filled by admin after event)
CREATE TABLE public.fight_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fight_id UUID UNIQUE NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  winner TEXT NOT NULL CHECK (winner IN ('fighter1', 'fighter2', 'draw', 'nc')),
  method TEXT NOT NULL CHECK (method IN ('KO/TKO', 'Submission', 'Decision', 'DQ', 'NC')),
  round INTEGER NOT NULL,
  time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Predictions
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  predicted_winner TEXT NOT NULL CHECK (predicted_winner IN ('fighter1', 'fighter2', 'draw')),
  predicted_method TEXT NOT NULL CHECK (predicted_method IN ('KO/TKO', 'Submission', 'Decision', 'DQ', 'NC')),
  predicted_round INTEGER NOT NULL,
  points_earned INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, fight_id, league_id)
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Leaderboard par ligue
CREATE OR REPLACE VIEW public.league_leaderboard AS
SELECT
  lm.league_id,
  p.id AS user_id,
  p.username,
  COALESCE(SUM(pred.points_earned), 0) AS total_points,
  COUNT(CASE WHEN pred.points_earned >= 10 THEN 1 END) AS correct_winner,
  COUNT(CASE WHEN pred.points_earned >= 15 THEN 1 END) AS correct_method,
  COUNT(CASE WHEN pred.points_earned = 30 THEN 1 END) AS perfect_picks,
  RANK() OVER (PARTITION BY lm.league_id ORDER BY COALESCE(SUM(pred.points_earned), 0) DESC) AS rank
FROM public.league_members lm
JOIN public.profiles p ON p.id = lm.user_id
LEFT JOIN public.predictions pred ON pred.user_id = lm.user_id AND pred.league_id = lm.league_id
GROUP BY lm.league_id, p.id, p.username;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mettre à jour updated_at sur les predictions
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Verrouiller automatiquement les pronostics passé la deadline
CREATE OR REPLACE FUNCTION public.lock_expired_events()
RETURNS void AS $$
BEGIN
  UPDATE public.ufc_events
  SET status = 'locked'
  WHERE status = 'upcoming'
    AND prediction_deadline < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ufc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Profiles : lecture publique, modification uniquement par le propriétaire
CREATE POLICY "Profiles are viewable by all authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Leagues : lecture par membres, création par utilisateurs authentifiés
CREATE POLICY "Leagues viewable by members"
  ON public.leagues FOR SELECT TO authenticated
  USING (
    id IN (SELECT league_id FROM public.league_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create leagues"
  ON public.leagues FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update leagues"
  ON public.leagues FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- League members : lecture par membres, insertion/suppression par soi-même
CREATE POLICY "Members can see their leagues"
  ON public.league_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR league_id IN (
    SELECT league_id FROM public.league_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can join leagues"
  ON public.league_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave leagues"
  ON public.league_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- UFC Events : lecture authentifiée, écriture admin
CREATE POLICY "Events are viewable by authenticated users"
  ON public.ufc_events FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Only admins can manage events"
  ON public.ufc_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Fights : lecture authentifiée, écriture admin
CREATE POLICY "Fights are viewable by authenticated users"
  ON public.fights FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Only admins can manage fights"
  ON public.fights FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Fight results : lecture authentifiée, écriture admin
CREATE POLICY "Fight results are viewable by authenticated users"
  ON public.fight_results FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Only admins can manage fight results"
  ON public.fight_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Predictions : lecture par membres de la même ligue
CREATE POLICY "Users can see predictions in their leagues"
  ON public.predictions FOR SELECT TO authenticated
  USING (
    league_id IN (SELECT league_id FROM public.league_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own predictions"
  ON public.predictions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own predictions"
  ON public.predictions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Admins peuvent tout faire sur les predictions (pour le calcul des points)
CREATE POLICY "Admins can manage all predictions"
  ON public.predictions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================================
-- DONNÉES DE DÉMO (optionnel — à supprimer en prod)
-- ============================================================

-- Décommente pour insérer un événement de test
/*
INSERT INTO public.ufc_events (name, date, location, prediction_deadline, status) VALUES
  ('UFC 310: Jones vs Miocic', '2025-12-07 03:00:00+00', 'T-Mobile Arena, Las Vegas', '2025-12-07 00:00:00+00', 'upcoming');

-- Récupère l'id avec : SELECT id FROM ufc_events WHERE name LIKE 'UFC 310%';
-- Puis insère les combats correspondants
*/

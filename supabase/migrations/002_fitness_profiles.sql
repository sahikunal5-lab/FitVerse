
-- ==========================================
-- FITVERSE FITNESS PROFILES
-- ==========================================

CREATE TABLE public.fitness_profiles (

    user_id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    age SMALLINT
        CHECK (age BETWEEN 13 AND 120),

    height_cm NUMERIC(5,1)
        CHECK (height_cm BETWEEN 50 AND 250),

    weight_kg NUMERIC(5,1)
        CHECK (weight_kg BETWEEN 10 AND 400),

    fitness_goal TEXT
        CHECK (
            fitness_goal IN (
                'weight_loss',
                'muscle_gain',
                'maintenance',
                'general_fitness'
            )
        ),

    experience_level TEXT
        CHECK (
            experience_level IN (
                'beginner',
                'intermediate',
                'advanced'
            )
        ),

    activity_level TEXT
        CHECK (
            activity_level IN (
                'sedentary',
                'lightly_active',
                'moderately_active',
                'very_active'
            )
        ),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()

);


-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.fitness_profiles
ENABLE ROW LEVEL SECURITY;


-- Explicit minimum permissions

REVOKE ALL ON TABLE public.fitness_profiles
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.fitness_profiles
TO authenticated;


-- ==========================================
-- USER CAN READ ONLY OWN FITNESS PROFILE
-- ==========================================

CREATE POLICY fitness_select_own
ON public.fitness_profiles
FOR SELECT
TO authenticated
USING (
    (SELECT auth.uid()) = user_id
);


-- ==========================================
-- USER CAN INSERT ONLY OWN PROFILE
-- ==========================================

CREATE POLICY fitness_insert_own
ON public.fitness_profiles
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.uid()) = user_id
);


-- ==========================================
-- USER CAN UPDATE ONLY OWN PROFILE
-- ==========================================

CREATE POLICY fitness_update_own
ON public.fitness_profiles
FOR UPDATE
TO authenticated
USING (
    (SELECT auth.uid()) = user_id
)
WITH CHECK (
    (SELECT auth.uid()) = user_id
);


-- ==========================================
-- AUTOMATIC UPDATED_AT TIMESTAMP
-- ==========================================

CREATE FUNCTION public.update_fitness_profile_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER fitness_profiles_updated_at
BEFORE UPDATE ON public.fitness_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_fitness_profile_timestamp();
```
 
All fitness fields are optional, allowing users to save their information gradually. The database restricts accepted values and automatically updates the modification timestamp.

**Important:** This migration is intended to run once on a database where `fitness_profiles` doesn't already exist.

The RLS policies ensure users can select, create and update only their own fitness profile. Supabase recommends combining explicit grants with RLS to protect data exposed through its API. <Cite refs={["turn244004search0","turn244004search1"]}/>

### Step 2 — Run the migration

Open your Supabase project → SQL Editor → New Query.

Paste the SQL and click **Run**.

You should see a successful execution message.

You do not need to recreate `public.profiles`, change Supabase authentication or modify the existing signup trigger.

### Step 3 — Verify the new table

Run:

```sql
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'fitness_profiles';
```

Expected:

| tablename | rowsecurity |
|---|---|
| fitness_profiles | true |

Then verify the policies:

```sql
SELECT
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'fitness_profiles';
```

Expected: three policies for `SELECT`, `INSERT` and `UPDATE`, all applying to `authenticated`.

## 3. How this will work later

The current Account popup will eventually have this behavior:

<box border radius="lg" padding={3} gap={1}>
  <box background="surface-secondary" padding={3} radius="md" align="center">
    **Click Fitness Preferences**
  </box>
  <box align="center"><icon name="arrow-down" color="secondary"/></box>
  <box border radius="md" padding={3} align="center">
    **Compact form opens**
    <caption>Age, height, weight, goal and activity</caption>
  </box>
  <box align="center"><icon name="arrow-down" color="secondary"/></box>
  <box border radius="md" padding={3} align="center">
    **FastAPI validates and saves details**
    <caption>Verified JWT + Supabase PostgreSQL RLS</caption>
  </box>
  <box align="center"><icon name="arrow-down" color="secondary"/></box>
  <box background="#ECFDF5" theme="light" padding={3} radius="md" align="center">
    <icon name="check-circle-filled" color="#15803D"/>
    **Preferences saved**
  </box>
</box>

We will build the form with React and add styling only to `src/styles/index.css`. No separate dashboard or Profile page is needed.

**Your next step:** Run the migration and verify that `fitness_profiles` exists with RLS enabled and three policies. Once that passes, we'll implement Phase 4.3.2 — Secure FastAPI endpoints for reading and updating fitness preferences.
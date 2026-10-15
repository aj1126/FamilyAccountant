-- =====================================================================
-- 1. BASE EXTENSIONS & SCHEMAS
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 2. TABLES DEFINITIONS (TypeORM CamelCase Compatible)
-- =====================================================================

-- Households
CREATE TABLE public.households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    "ownerId" UUID NOT NULL, -- references users.id, set by creator
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Users (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY, -- matches auth.users.id
    email TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL, -- local auth fallback
    "displayName" TEXT NOT NULL,
    "householdId" UUID REFERENCES public.households(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'dependent')) DEFAULT 'member',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Complete the circular reference via FK
ALTER TABLE public.households ADD CONSTRAINT fk_household_owner FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON DEFERRABLE INITIALLY DEFERRED;

-- Categories (Hierarchical & Customisable)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "householdId" UUID REFERENCES public.households(id) ON DELETE CASCADE, -- NULL means a system default category
    "parentId" UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    color VARCHAR(7), -- Hex code (e.g. #FF5733)
    icon TEXT, -- Icon key for client display
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Accounts
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'investment', 'allowance', 'credit_card', 'cash')),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Transactions (Compound unique constraint for local offline IDs)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "localId" TEXT, -- for client-side offline sync reference
    "accountId" UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    "householdId" UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    "categoryId" UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL, -- positive for income/credits, negative for expenses/debits
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    "transactionDate" DATE NOT NULL,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "deletedAt" TIMESTAMPTZ, -- for soft deletes
    CONSTRAINT unique_household_local_id UNIQUE ("householdId", "localId")
);

-- Budgets (with soft-delete support)
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    "categoryId" UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL CHECK ("endDate" >= "startDate"),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "deletedAt" TIMESTAMPTZ, -- for soft deletes
    CONSTRAINT unique_household_category_period UNIQUE ("householdId", "categoryId", "startDate")
);

-- Debts
CREATE TABLE public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    "creditorId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "debtorId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('owe_to', 'owed_by')),
    settled BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Payments (for partial or full debt settlement)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "debtId" UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    "householdId" UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    "paidAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    note TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Household Invitations
CREATE TABLE public.household_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('member', 'dependent')) DEFAULT 'member',
    "createdBy" UUID REFERENCES public.users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Audit Logs (Centralized Immutable Table)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    "tableName" TEXT NOT NULL,
    "recordId" UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    "oldData" JSONB,
    "newData" JSONB,
    "performedBy" UUID REFERENCES public.users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =====================================================================
-- 3. INDEXES & UNIQUENESS FOR PERFORMANCE & COLLISION PREVENTION
-- =====================================================================
CREATE INDEX idx_users_household ON public.users("householdId");
CREATE INDEX idx_categories_household ON public.categories("householdId");
CREATE INDEX idx_accounts_household ON public.accounts("householdId");
CREATE INDEX idx_transactions_household ON public.transactions("householdId");
CREATE INDEX idx_transactions_account ON public.transactions("accountId");
CREATE INDEX idx_transactions_date ON public.transactions("transactionDate");
CREATE INDEX idx_budgets_household ON public.budgets("householdId");
CREATE INDEX idx_debts_household ON public.debts("householdId");
CREATE INDEX idx_debts_creditor ON public.debts("creditorId");
CREATE INDEX idx_debts_debtor ON public.debts("debtorId");
CREATE INDEX idx_payments_household ON public.payments("householdId");
CREATE INDEX idx_payments_debt ON public.payments("debtId");
CREATE INDEX idx_audit_logs_household ON public.audit_logs("householdId");
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs("createdAt" DESC);

-- Partial Indexes to enforce category tree uniqueness safely (with NULLs)
CREATE UNIQUE INDEX idx_categories_unique_system 
    ON public.categories (name) 
    WHERE "householdId" IS NULL AND "parentId" IS NULL;

CREATE UNIQUE INDEX idx_categories_unique_system_child 
    ON public.categories ("parentId", name) 
    WHERE "householdId" IS NULL AND "parentId" IS NOT NULL;

CREATE UNIQUE INDEX idx_categories_unique_household 
    ON public.categories ("householdId", name) 
    WHERE "householdId" IS NOT NULL AND "parentId" IS NULL;

CREATE UNIQUE INDEX idx_categories_unique_household_child 
    ON public.categories ("householdId", "parentId", name) 
    WHERE "householdId" IS NOT NULL AND "parentId" IS NOT NULL;

-- =====================================================================
-- 4. SECURITY DEFINER HELPER FUNCTIONS (RLS Helpers)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_my_household_id()
RETURNS UUID SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN (SELECT "householdId" FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS across all tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Households Policies
CREATE POLICY select_household ON public.households
    FOR SELECT USING (id = public.get_my_household_id());

CREATE POLICY insert_household ON public.households
    FOR INSERT WITH CHECK (auth.uid() = "ownerId");

CREATE POLICY update_household ON public.households
    FOR UPDATE USING (id = public.get_my_household_id() AND public.get_my_role() = 'admin');

CREATE POLICY delete_household ON public.households
    FOR DELETE USING ("ownerId" = auth.uid());

-- 5.2 Users Policies
CREATE POLICY select_users ON public.users
    FOR SELECT USING (id = auth.uid() OR "householdId" = public.get_my_household_id());

CREATE POLICY insert_users ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY update_users ON public.users
    FOR UPDATE USING (id = auth.uid() OR ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin'));

CREATE POLICY delete_users ON public.users
    FOR DELETE USING (id = auth.uid() OR ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin'));

-- 5.3 Categories Policies
CREATE POLICY select_categories ON public.categories
    FOR SELECT USING ("householdId" IS NULL OR "householdId" = public.get_my_household_id());

CREATE POLICY insert_categories ON public.categories
    FOR INSERT WITH CHECK ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

CREATE POLICY update_categories ON public.categories
    FOR UPDATE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

CREATE POLICY delete_categories ON public.categories
    FOR DELETE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

-- 5.4 Accounts Policies
CREATE POLICY select_accounts ON public.accounts
    FOR SELECT USING ("householdId" = public.get_my_household_id());

CREATE POLICY insert_accounts ON public.accounts
    FOR INSERT WITH CHECK ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

CREATE POLICY update_accounts ON public.accounts
    FOR UPDATE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

CREATE POLICY delete_accounts ON public.accounts
    FOR DELETE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

-- 5.5 Transactions Policies
CREATE POLICY select_transactions ON public.transactions
    FOR SELECT USING ("householdId" = public.get_my_household_id());

CREATE POLICY insert_transactions ON public.transactions
    FOR INSERT WITH CHECK (
        "householdId" = public.get_my_household_id() AND (
            public.get_my_role() IN ('admin', 'member') OR 
            (
                public.get_my_role() = 'dependent' AND 
                "userId" = auth.uid() AND 
                EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = "accountId" AND a.type = 'allowance')
            )
        )
    );

CREATE POLICY update_transactions ON public.transactions
    FOR UPDATE USING (
        "householdId" = public.get_my_household_id() AND (
            public.get_my_role() = 'admin' OR 
            (public.get_my_role() = 'member' AND "userId" = auth.uid())
        )
    );

CREATE POLICY delete_transactions ON public.transactions
    FOR DELETE USING (
        "householdId" = public.get_my_household_id() AND (
            public.get_my_role() = 'admin' OR 
            (public.get_my_role() = 'member' AND "userId" = auth.uid())
        )
    );

-- 5.6 Budgets Policies
CREATE POLICY select_budgets ON public.budgets
    FOR SELECT USING ("householdId" = public.get_my_household_id());

CREATE POLICY insert_budgets ON public.budgets
    FOR INSERT WITH CHECK ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

CREATE POLICY update_budgets ON public.budgets
    FOR UPDATE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

CREATE POLICY delete_budgets ON public.budgets
    FOR DELETE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

-- 5.7 Debts Policies
CREATE POLICY select_debts ON public.debts
    FOR SELECT USING ("householdId" = public.get_my_household_id());

CREATE POLICY insert_debts ON public.debts
    FOR INSERT WITH CHECK ("householdId" = public.get_my_household_id() AND public.get_my_role() IN ('admin', 'member'));

CREATE POLICY update_debts ON public.debts
    FOR UPDATE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() IN ('admin', 'member'));

CREATE POLICY delete_debts ON public.debts
    FOR DELETE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

-- 5.8 Payments Policies
CREATE POLICY select_payments ON public.payments
    FOR SELECT USING ("householdId" = public.get_my_household_id());

CREATE POLICY insert_payments ON public.payments
    FOR INSERT WITH CHECK ("householdId" = public.get_my_household_id() AND public.get_my_role() IN ('admin', 'member'));

CREATE POLICY update_payments ON public.payments
    FOR UPDATE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() IN ('admin', 'member'));

CREATE POLICY delete_payments ON public.payments
    FOR DELETE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

-- 5.9 Household Invitations Policies
CREATE POLICY select_invitations ON public.household_invitations
    FOR SELECT USING ("householdId" = public.get_my_household_id() OR LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY insert_invitations ON public.household_invitations
    FOR INSERT WITH CHECK ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

CREATE POLICY delete_invitations ON public.household_invitations
    FOR DELETE USING ("householdId" = public.get_my_household_id() AND public.get_my_role() = 'admin');

-- 5.10 Audit Logs Policies
CREATE POLICY select_audit_logs ON public.audit_logs
    FOR SELECT USING ("householdId" = public.get_my_household_id() AND public.get_my_role() IN ('admin', 'member'));

-- =====================================================================
-- 6. TRIGGER FUNCTIONS & DATABASE LOGIC
-- =====================================================================

-- 6.1 Generic Auditing Trigger
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_household_id UUID;
  v_performed_by UUID;
BEGIN
  v_performed_by := auth.uid();

  IF TG_TABLE_NAME = 'households' THEN
    IF TG_OP = 'DELETE' THEN
      v_household_id := OLD.id;
    ELSE
      v_household_id := NEW.id;
    END IF;
  ELSE
    IF TG_OP = 'DELETE' THEN
      v_household_id := OLD."householdId";
    ELSE
      v_household_id := NEW."householdId";
    END IF;
  END IF;

  INSERT INTO public.audit_logs (
    "householdId",
    "tableName",
    "recordId",
    action,
    "oldData",
    "newData",
    "performedBy"
  ) VALUES (
    v_household_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_performed_by
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6.2 Audit Logs Immutability Trigger
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- 6.3 Strict Single-Currency Guard Trigger
CREATE OR REPLACE FUNCTION public.enforce_household_currency_match()
RETURNS TRIGGER AS $$
DECLARE
  v_household_currency VARCHAR(3);
BEGIN
  SELECT currency INTO v_household_currency FROM public.households WHERE id = NEW."householdId";
  
  IF NEW.currency <> v_household_currency THEN
    RAISE EXCEPTION 'Currency Mismatch: Entity currency (%) must match household base currency (%)', NEW.currency, v_household_currency;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6.4 Account Balance Synchronization Trigger
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_target_account_id UUID;
  v_target_currency VARCHAR(3);
BEGIN
  -- Determine target account for validation
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    v_target_account_id := NEW."accountId";
  ELSE
    v_target_account_id := OLD."accountId";
  END IF;

  IF v_target_account_id IS NOT NULL THEN
    SELECT currency INTO v_target_currency FROM public.accounts WHERE id = v_target_account_id;
    
    -- Currency Post Verification Guard
    IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.currency <> v_target_currency THEN
      RAISE EXCEPTION 'Currency mismatch: transaction currency % does not match account currency %', NEW.currency, v_target_currency;
    END IF;
  END IF;

  -- Balance application
  IF TG_OP = 'INSERT' THEN
    IF NEW."accountId" IS NOT NULL AND NEW."deletedAt" IS NULL THEN
      UPDATE public.accounts
      SET balance = balance + NEW.amount
      WHERE id = NEW."accountId";
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Case 1: Transitioning to Soft-Deleted
    IF OLD."deletedAt" IS NULL AND NEW."deletedAt" IS NOT NULL THEN
      IF OLD."accountId" IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance - OLD.amount
        WHERE id = OLD."accountId";
      END IF;
    
    -- Case 2: Restoring from Soft-Deleted
    ELSIF OLD."deletedAt" IS NOT NULL AND NEW."deletedAt" IS NULL THEN
      IF NEW."accountId" IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance + NEW.amount
        WHERE id = NEW."accountId";
      END IF;

    -- Case 3: Standard Update (Both are active)
    ELSIF NEW."deletedAt" IS NULL THEN
      -- Account reassignment
      IF COALESCE(OLD."accountId", '00000000-0000-0000-0000-000000000000'::uuid) <> COALESCE(NEW."accountId", '00000000-0000-0000-0000-000000000000'::uuid) THEN
        IF OLD."accountId" IS NOT NULL THEN
          UPDATE public.accounts
          SET balance = balance - OLD.amount
          WHERE id = OLD."accountId";
        END IF;
        IF NEW."accountId" IS NOT NULL THEN
          UPDATE public.accounts
          SET balance = balance + NEW.amount
          WHERE id = NEW."accountId";
        END IF;
      -- Amount modifications
      ELSIF OLD.amount <> NEW.amount AND NEW."accountId" IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance - OLD.amount + NEW.amount
        WHERE id = NEW."accountId";
      END IF;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD."accountId" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
      UPDATE public.accounts
      SET balance = balance - OLD.amount
      WHERE id = OLD."accountId";
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6.5 Dependent Limits Trigger (RBAC Overdraft Guard)
CREATE OR REPLACE FUNCTION public.enforce_dependent_limits()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
  v_current_balance NUMERIC(15, 2);
BEGIN
  v_role := public.get_my_role();
  
  IF v_role = 'dependent' THEN
    SELECT balance INTO v_current_balance 
    FROM public.accounts 
    WHERE id = NEW."accountId";
    
    IF v_current_balance + NEW.amount < 0 THEN
      RAISE EXCEPTION 'Transaction rejected: Dependent transaction of % would exceed allowance balance (%)', NEW.amount, v_current_balance;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6.6 Cross-Tenant Integrity Trigger: Debts
CREATE OR REPLACE FUNCTION public.enforce_debt_household_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_creditor_household UUID;
  v_debtor_household UUID;
BEGIN
  SELECT "householdId" INTO v_creditor_household FROM public.users WHERE id = NEW."creditorId";
  SELECT "householdId" INTO v_debtor_household FROM public.users WHERE id = NEW."debtorId";
  
  IF v_creditor_household <> NEW."householdId" OR v_debtor_household <> NEW."householdId" THEN
    RAISE EXCEPTION 'Referential Isolation Failure: Creditor and debtor must belong to the same household as the debt record.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6.7 Cross-Tenant Integrity Trigger: Payments
CREATE OR REPLACE FUNCTION public.enforce_payment_household_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_debt_household UUID;
BEGIN
  SELECT "householdId" INTO v_debt_household FROM public.debts WHERE id = NEW."debtId";
  
  IF v_debt_household <> NEW."householdId" THEN
    RAISE EXCEPTION 'Referential Isolation Failure: Payment householdId must match the parent debt householdId.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6.8 Debt Auto-Settlement Trigger
CREATE OR REPLACE FUNCTION public.update_debt_settlement()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_debt_amount NUMERIC(15, 2);
  v_total_payments NUMERIC(15, 2);
BEGIN
  SELECT amount INTO v_debt_amount 
  FROM public.debts 
  WHERE id = COALESCE(NEW."debtId", OLD."debtId");
  
  SELECT COALESCE(SUM(amount), 0) INTO v_total_payments
  FROM public.payments
  WHERE "debtId" = COALESCE(NEW."debtId", OLD."debtId");
  
  IF v_total_payments >= v_debt_amount THEN
    UPDATE public.debts
    SET settled = TRUE, "updatedAt" = timezone('utc'::text, now())
    WHERE id = COALESCE(NEW."debtId", OLD."debtId");
  ELSE
    UPDATE public.debts
    SET settled = FALSE, "updatedAt" = timezone('utc'::text, now())
    WHERE id = COALESCE(NEW."debtId", OLD."debtId");
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6.9 User Onboarding Trigger (Link auth.users to public.users & check invitations)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_invite_household_id UUID;
  v_invite_role TEXT;
BEGIN
  -- Check for pending invitations (case-insensitive email matching)
  SELECT "householdId", role INTO v_invite_household_id, v_invite_role
  FROM public.household_invitations
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;

  IF FOUND THEN
    -- Auto-link user to the household from the invitation (with conflict check)
    INSERT INTO public.users (id, email, "displayName", role, "householdId", "passwordHash")
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      v_invite_role,
      v_invite_household_id,
      ''
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      "displayName" = EXCLUDED."displayName",
      "householdId" = COALESCE(public.users."householdId", EXCLUDED."householdId"),
      role = COALESCE(public.users.role, EXCLUDED.role);
    
    -- Consume the invitation
    DELETE FROM public.household_invitations 
    WHERE LOWER(email) = LOWER(NEW.email);
  ELSE
    -- Default onboarding (no household assigned yet) (with conflict check)
    INSERT INTO public.users (id, email, "displayName", role, "householdId", "passwordHash")
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      'member',
      NULL,
      ''
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      "displayName" = EXCLUDED."displayName";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.10 Household Creator Linkage Trigger
CREATE OR REPLACE FUNCTION public.handle_new_household()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users
  SET "householdId" = NEW.id, role = 'admin'
  WHERE id = NEW."ownerId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_household_created
    AFTER INSERT ON public.households
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_household();

-- =====================================================================
-- 7. ATTACH AUDIT, INTEGRITY, AND LOGIC TRIGGERS TO TABLES
-- =====================================================================

-- Attach Audit Triggers (Covering households and users too)
CREATE TRIGGER audit_households AFTER INSERT OR UPDATE OR DELETE ON public.households FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
CREATE TRIGGER audit_accounts AFTER INSERT OR UPDATE OR DELETE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
CREATE TRIGGER audit_categories AFTER INSERT OR UPDATE OR DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
CREATE TRIGGER audit_budgets AFTER INSERT OR UPDATE OR DELETE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
CREATE TRIGGER audit_debts AFTER INSERT OR UPDATE OR DELETE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Attach Currency Integrity Guards
CREATE TRIGGER trg_currency_match_accounts BEFORE INSERT OR UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.enforce_household_currency_match();
CREATE TRIGGER trg_currency_match_transactions BEFORE INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.enforce_household_currency_match();
CREATE TRIGGER trg_currency_match_budgets BEFORE INSERT OR UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.enforce_household_currency_match();
CREATE TRIGGER trg_currency_match_debts BEFORE INSERT OR UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.enforce_household_currency_match();
CREATE TRIGGER trg_currency_match_payments BEFORE INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.enforce_household_currency_match();

-- Attach Cross-Tenant Guards
CREATE TRIGGER trg_debt_household_integrity
    BEFORE INSERT OR UPDATE ON public.debts
    FOR EACH ROW EXECUTE FUNCTION public.enforce_debt_household_integrity();

CREATE TRIGGER trg_payment_household_integrity
    BEFORE INSERT OR UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.enforce_payment_household_integrity();

-- Attach Balance Update Trigger to Transactions
CREATE TRIGGER trg_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- Attach Dependent Safety Trigger to Transactions (Runs before balance check to validate balance)
CREATE TRIGGER trg_dependent_limit_check
    BEFORE INSERT ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.enforce_dependent_limits();

-- Attach Payment Settlement Trigger to Payments
CREATE TRIGGER trg_update_debt_settlement
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_debt_settlement();

-- =====================================================================
-- 8. EXTRA CONVENIENCE FUNCTIONS
-- =====================================================================

-- RPC Invitation Acceptance (Case-Insensitive Match Fix)
CREATE OR REPLACE FUNCTION public.accept_invitation(p_invitation_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE
  v_household_id UUID;
  v_role TEXT;
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  
  SELECT "householdId", role INTO v_household_id, v_role
  FROM public.household_invitations
  WHERE id = p_invitation_id AND LOWER(email) = LOWER(v_email);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or email mismatch.';
  END IF;
  
  UPDATE public.users
  SET "householdId" = v_household_id, role = v_role
  WHERE id = auth.uid();
  
  DELETE FROM public.household_invitations WHERE id = p_invitation_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

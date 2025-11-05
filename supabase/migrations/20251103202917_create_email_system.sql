/*
  # Système de Courriel Complet

  ## Vue d'ensemble
  Cette migration crée un système de courriel interne complet pour WebOS Québec
  avec boîte de réception, envoyés, brouillons, corbeille et pièces jointes.

  ## Nouvelles Tables

  ### email_accounts
  Comptes de courriel pour chaque utilisateur
  - `id` (uuid, primary key)
  - `user_id` (uuid, references users) - Propriétaire du compte
  - `email_address` (text) - Adresse courriel (format: prenom.nom@quebec.gouv.qc.ca)
  - `display_name` (text) - Nom d'affichage
  - `signature` (text) - Signature automatique
  - `is_active` (boolean) - Compte actif
  - `storage_used_mb` (numeric) - Espace utilisé en MB
  - `storage_quota_mb` (numeric) - Quota d'espace
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### emails
  Messages électroniques
  - `id` (uuid, primary key)
  - `account_id` (uuid, references email_accounts) - Compte propriétaire
  - `from_address` (text) - Expéditeur
  - `to_addresses` (text[]) - Destinataires
  - `cc_addresses` (text[]) - Copies
  - `bcc_addresses` (text[]) - Copies cachées
  - `subject` (text) - Sujet
  - `body_text` (text) - Corps du message en texte
  - `body_html` (text) - Corps du message en HTML
  - `is_read` (boolean) - Lu/Non lu
  - `is_starred` (boolean) - Marqué comme important
  - `is_draft` (boolean) - Brouillon
  - `is_deleted` (boolean) - Dans la corbeille
  - `folder` (text) - inbox, sent, drafts, trash, archive
  - `thread_id` (uuid) - ID du fil de conversation
  - `in_reply_to` (uuid, references emails) - Réponse à
  - `priority` (text) - low, normal, high
  - `sent_at` (timestamptz) - Date d'envoi
  - `read_at` (timestamptz) - Date de lecture
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### email_attachments
  Pièces jointes
  - `id` (uuid, primary key)
  - `email_id` (uuid, references emails) - Email parent
  - `filename` (text) - Nom du fichier
  - `file_path` (text) - Chemin de stockage
  - `file_size` (bigint) - Taille en bytes
  - `mime_type` (text) - Type MIME
  - `is_inline` (boolean) - Image inline
  - `content_id` (text) - ID pour images inline
  - `created_at` (timestamptz)

  ### email_labels
  Étiquettes personnalisées
  - `id` (uuid, primary key)
  - `account_id` (uuid, references email_accounts)
  - `name` (text) - Nom de l'étiquette
  - `color` (text) - Couleur hex
  - `created_at` (timestamptz)

  ### email_label_assignments
  Association emails-étiquettes
  - `email_id` (uuid, references emails)
  - `label_id` (uuid, references email_labels)
  - `created_at` (timestamptz)
  - PRIMARY KEY (email_id, label_id)

  ## Sécurité
  - RLS activé sur toutes les tables
  - Utilisateurs peuvent voir uniquement leurs propres courriels
  - Admins ont accès complet pour support

  ## Indexes
  - Optimisé pour recherche rapide
  - Index sur dates, statuts, et folders
*/

-- ============================================
-- TABLES
-- ============================================

-- Comptes courriel
CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_address text UNIQUE NOT NULL,
  display_name text NOT NULL,
  signature text DEFAULT '',
  is_active boolean DEFAULT true,
  storage_used_mb numeric(10,2) DEFAULT 0,
  storage_quota_mb numeric(10,2) DEFAULT 5000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Emails
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE NOT NULL,
  from_address text NOT NULL,
  to_addresses text[] NOT NULL DEFAULT '{}',
  cc_addresses text[] DEFAULT '{}',
  bcc_addresses text[] DEFAULT '{}',
  subject text NOT NULL DEFAULT '(Sans objet)',
  body_text text DEFAULT '',
  body_html text DEFAULT '',
  is_read boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  is_draft boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  folder text DEFAULT 'inbox' CHECK (folder IN ('inbox', 'sent', 'drafts', 'trash', 'archive')),
  thread_id uuid,
  in_reply_to uuid REFERENCES emails(id),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pièces jointes
CREATE TABLE IF NOT EXISTS email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  is_inline boolean DEFAULT false,
  content_id text,
  created_at timestamptz DEFAULT now()
);

-- Étiquettes
CREATE TABLE IF NOT EXISTS email_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  UNIQUE(account_id, name)
);

-- Association emails-étiquettes
CREATE TABLE IF NOT EXISTS email_label_assignments (
  email_id uuid REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
  label_id uuid REFERENCES email_labels(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (email_id, label_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Email accounts
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email_address ON email_accounts(email_address);

-- Emails
CREATE INDEX IF NOT EXISTS idx_emails_account_id ON emails(account_id);
CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_is_starred ON emails(is_starred);
CREATE INDEX IF NOT EXISTS idx_emails_is_deleted ON emails(is_deleted);
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_from_address ON emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_to_addresses ON emails USING GIN(to_addresses);

-- Attachments
CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id ON email_attachments(email_id);

-- Labels
CREATE INDEX IF NOT EXISTS idx_email_labels_account_id ON email_labels(account_id);

-- Label assignments
CREATE INDEX IF NOT EXISTS idx_email_label_assignments_email_id ON email_label_assignments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_label_assignments_label_id ON email_label_assignments(label_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON email_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_label_assignments ENABLE ROW LEVEL SECURITY;

-- Email Accounts Policies
CREATE POLICY "Users can view own email account"
  ON email_accounts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own email account"
  ON email_accounts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "System can create email accounts"
  ON email_accounts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all email accounts"
  ON email_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Emails Policies
CREATE POLICY "Users can view own emails"
  ON emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = emails.account_id
      AND email_accounts.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create own emails"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = emails.account_id
      AND email_accounts.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own emails"
  ON emails FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = emails.account_id
      AND email_accounts.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = emails.account_id
      AND email_accounts.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own emails"
  ON emails FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = emails.account_id
      AND email_accounts.user_id = (SELECT auth.uid())
    )
  );

-- Email Attachments Policies
CREATE POLICY "Users can view attachments of own emails"
  ON email_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emails
      JOIN email_accounts ON email_accounts.id = emails.account_id
      WHERE emails.id = email_attachments.email_id
      AND email_accounts.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create attachments for own emails"
  ON email_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emails
      JOIN email_accounts ON email_accounts.id = emails.account_id
      WHERE emails.id = email_attachments.email_id
      AND email_accounts.user_id = (SELECT auth.uid())
    )
  );

-- Email Labels Policies
CREATE POLICY "Users can manage own labels"
  ON email_labels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_labels.account_id
      AND email_accounts.user_id = (SELECT auth.uid())
    )
  );

-- Label Assignments Policies
CREATE POLICY "Users can manage own label assignments"
  ON email_label_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emails
      JOIN email_accounts ON email_accounts.id = emails.account_id
      WHERE emails.id = email_label_assignments.email_id
      AND email_accounts.user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour créer automatiquement un thread_id si null
CREATE OR REPLACE FUNCTION set_email_thread_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.thread_id IS NULL THEN
    NEW.thread_id := NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_email_thread_id_trigger
  BEFORE INSERT ON emails
  FOR EACH ROW
  EXECUTE FUNCTION set_email_thread_id();

-- Analyser les tables
ANALYZE email_accounts;
ANALYZE emails;
ANALYZE email_attachments;
ANALYZE email_labels;
ANALYZE email_label_assignments;

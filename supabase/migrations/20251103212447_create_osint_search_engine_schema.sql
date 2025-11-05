/*
  # OSINT Search Engine - Core Schema
  
  ## Overview
  This migration creates the foundational schema for an OSINT search engine with 
  trusted source indexing, semantic search capabilities, and AI synthesis tracking.
  
  ## 1. New Tables
  
  ### `trusted_sources`
  Manages the whitelist of reliable domains and sources for OSINT crawling.
  - `id` (uuid, primary key) - Unique identifier
  - `domain` (text, unique, indexed) - Domain name (e.g., "gov.uk", "nature.com")
  - `name` (text) - Human-readable source name
  - `category` (text) - Source type: government, academic, media, international_org, ngo
  - `reliability_score` (integer, 1-100) - Manual reliability rating
  - `country_code` (text, nullable) - ISO country code
  - `language` (text) - Primary language code (ISO 639-1)
  - `crawl_frequency` (text) - How often to recrawl: daily, weekly, monthly
  - `is_active` (boolean) - Whether to include in crawling
  - `robots_txt_url` (text, nullable) - Cached robots.txt location
  - `last_crawled_at` (timestamptz, nullable) - Last successful crawl timestamp
  - `metadata` (jsonb) - Additional metadata (contact info, API endpoints, etc.)
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time
  
  ### `indexed_pages`
  Stores metadata for all crawled and indexed web pages.
  - `id` (uuid, primary key) - Unique identifier
  - `url` (text, unique, indexed) - Full page URL
  - `source_id` (uuid, foreign key) - Reference to trusted_sources
  - `title` (text) - Page title
  - `content` (text) - Extracted main content (cleaned)
  - `content_hash` (text, indexed) - SHA-256 hash for deduplication
  - `author` (text, nullable) - Content author if available
  - `published_at` (timestamptz, nullable) - Original publication date
  - `language` (text) - Detected language
  - `word_count` (integer) - Content word count
  - `indexed_at` (timestamptz) - When page was indexed
  - `last_checked_at` (timestamptz) - Last verification timestamp
  - `status` (text) - active, updated, deleted, error
  - `metadata` (jsonb) - Additional extracted metadata
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time
  
  ### `page_embeddings`
  Stores vector embeddings for semantic search using pgvector.
  - `id` (uuid, primary key) - Unique identifier
  - `page_id` (uuid, foreign key, unique) - Reference to indexed_pages
  - `embedding` (vector(1536)) - Text embedding vector (OpenAI ada-002 dimension)
  - `model` (text) - Embedding model used (e.g., "text-embedding-ada-002")
  - `created_at` (timestamptz) - Embedding creation time
  
  ### `search_queries`
  Logs all search queries for analytics and improvement.
  - `id` (uuid, primary key) - Unique identifier
  - `query_text` (text) - The search query
  - `query_embedding` (vector(1536), nullable) - Query embedding for semantic search
  - `filters` (jsonb, nullable) - Applied filters (category, date range, etc.)
  - `result_count` (integer) - Number of results returned
  - `synthesis_requested` (boolean) - Whether AI synthesis was requested
  - `created_at` (timestamptz) - Query timestamp
  
  ### `ai_syntheses`
  Tracks AI-generated syntheses with source citations.
  - `id` (uuid, primary key) - Unique identifier
  - `query_id` (uuid, foreign key) - Reference to search_queries
  - `synthesis_text` (text) - Generated synthesis content
  - `source_page_ids` (uuid[], indexed) - Array of page IDs used as sources
  - `model` (text) - AI model used (e.g., "gpt-4", "claude-3")
  - `tokens_used` (integer) - Token count for cost tracking
  - `generation_time_ms` (integer) - Time taken to generate
  - `created_at` (timestamptz) - Synthesis creation time
  
  ### `crawl_queue`
  Manages the queue of URLs to be crawled or recrawled.
  - `id` (uuid, primary key) - Unique identifier
  - `url` (text, indexed) - URL to crawl
  - `source_id` (uuid, foreign key) - Reference to trusted_sources
  - `priority` (integer, indexed) - Priority level (1-10, higher = more urgent)
  - `status` (text, indexed) - pending, processing, completed, failed
  - `attempts` (integer) - Number of crawl attempts
  - `last_attempt_at` (timestamptz, nullable) - Last attempt timestamp
  - `error_message` (text, nullable) - Error details if failed
  - `scheduled_for` (timestamptz, indexed) - When to crawl
  - `created_at` (timestamptz) - Record creation time
  
  ## 2. Indexes
  - Full-text search indexes on page content and titles
  - Vector similarity indexes for semantic search
  - Performance indexes on frequently queried fields
  
  ## 3. Security (RLS)
  - Public read access to indexed pages and search results
  - Restricted write access to crawling and indexing functions only
  - Admin-only access to trusted sources management
  
  ## 4. Extensions
  - Enable pgvector for vector similarity search
  - Enable pg_trgm for fuzzy text search
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trusted_sources table
CREATE TABLE IF NOT EXISTS trusted_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('government', 'academic', 'media', 'international_org', 'ngo', 'other')),
  reliability_score integer NOT NULL CHECK (reliability_score >= 1 AND reliability_score <= 100),
  country_code text,
  language text NOT NULL DEFAULT 'en',
  crawl_frequency text NOT NULL DEFAULT 'weekly' CHECK (crawl_frequency IN ('daily', 'weekly', 'monthly')),
  is_active boolean DEFAULT true,
  robots_txt_url text,
  last_crawled_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexed_pages table
CREATE TABLE IF NOT EXISTS indexed_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text UNIQUE NOT NULL,
  source_id uuid NOT NULL REFERENCES trusted_sources(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  content_hash text NOT NULL,
  author text,
  published_at timestamptz,
  language text NOT NULL DEFAULT 'en',
  word_count integer DEFAULT 0,
  indexed_at timestamptz DEFAULT now(),
  last_checked_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'updated', 'deleted', 'error')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create page_embeddings table
CREATE TABLE IF NOT EXISTS page_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid UNIQUE NOT NULL REFERENCES indexed_pages(id) ON DELETE CASCADE,
  embedding vector(1536),
  model text NOT NULL DEFAULT 'text-embedding-ada-002',
  created_at timestamptz DEFAULT now()
);

-- Create search_queries table
CREATE TABLE IF NOT EXISTS search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text text NOT NULL,
  query_embedding vector(1536),
  filters jsonb,
  result_count integer DEFAULT 0,
  synthesis_requested boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create ai_syntheses table
CREATE TABLE IF NOT EXISTS ai_syntheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid NOT NULL REFERENCES search_queries(id) ON DELETE CASCADE,
  synthesis_text text NOT NULL,
  source_page_ids uuid[] NOT NULL,
  model text NOT NULL,
  tokens_used integer DEFAULT 0,
  generation_time_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create crawl_queue table
CREATE TABLE IF NOT EXISTS crawl_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  source_id uuid NOT NULL REFERENCES trusted_sources(id) ON DELETE CASCADE,
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts integer DEFAULT 0,
  last_attempt_at timestamptz,
  error_message text,
  scheduled_for timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trusted_sources_domain ON trusted_sources(domain);
CREATE INDEX IF NOT EXISTS idx_trusted_sources_category ON trusted_sources(category);
CREATE INDEX IF NOT EXISTS idx_trusted_sources_active ON trusted_sources(is_active);

CREATE INDEX IF NOT EXISTS idx_indexed_pages_url ON indexed_pages(url);
CREATE INDEX IF NOT EXISTS idx_indexed_pages_source_id ON indexed_pages(source_id);
CREATE INDEX IF NOT EXISTS idx_indexed_pages_content_hash ON indexed_pages(content_hash);
CREATE INDEX IF NOT EXISTS idx_indexed_pages_status ON indexed_pages(status);
CREATE INDEX IF NOT EXISTS idx_indexed_pages_published_at ON indexed_pages(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_indexed_pages_title_trgm ON indexed_pages USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_indexed_pages_content_trgm ON indexed_pages USING gin(content gin_trgm_ops);

-- Vector similarity index for semantic search
CREATE INDEX IF NOT EXISTS idx_page_embeddings_vector ON page_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_syntheses_query_id ON ai_syntheses(query_id);
CREATE INDEX IF NOT EXISTS idx_ai_syntheses_source_page_ids ON ai_syntheses USING gin(source_page_ids);

CREATE INDEX IF NOT EXISTS idx_crawl_queue_status ON crawl_queue(status);
CREATE INDEX IF NOT EXISTS idx_crawl_queue_priority ON crawl_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_queue_scheduled_for ON crawl_queue(scheduled_for);

-- Enable Row Level Security
ALTER TABLE trusted_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexed_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_syntheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_queue ENABLE ROW LEVEL SECURITY;

-- Public read access to trusted sources
CREATE POLICY "Public can view active trusted sources"
  ON trusted_sources FOR SELECT
  USING (is_active = true);

-- Public read access to indexed pages
CREATE POLICY "Public can view active indexed pages"
  ON indexed_pages FOR SELECT
  USING (status = 'active');

-- Public read access to embeddings (needed for search)
CREATE POLICY "Public can view page embeddings"
  ON page_embeddings FOR SELECT
  USING (true);

-- Public can create search queries
CREATE POLICY "Anyone can create search queries"
  ON search_queries FOR INSERT
  WITH CHECK (true);

-- Public can view search queries (for analytics)
CREATE POLICY "Public can view search queries"
  ON search_queries FOR SELECT
  USING (true);

-- Public can view AI syntheses
CREATE POLICY "Public can view AI syntheses"
  ON ai_syntheses FOR SELECT
  USING (true);

-- Public can view crawl queue status
CREATE POLICY "Public can view crawl queue"
  ON crawl_queue FOR SELECT
  USING (true);

-- Insert some initial trusted sources
INSERT INTO trusted_sources (domain, name, category, reliability_score, country_code, language) VALUES
  ('un.org', 'United Nations', 'international_org', 95, 'INT', 'en'),
  ('who.int', 'World Health Organization', 'international_org', 95, 'INT', 'en'),
  ('europa.eu', 'European Union', 'government', 90, 'EU', 'en'),
  ('nature.com', 'Nature Publishing Group', 'academic', 95, 'GB', 'en'),
  ('science.org', 'Science Magazine', 'academic', 95, 'US', 'en'),
  ('bbc.com', 'BBC News', 'media', 85, 'GB', 'en'),
  ('reuters.com', 'Reuters', 'media', 90, 'GB', 'en'),
  ('apnews.com', 'Associated Press', 'media', 90, 'US', 'en'),
  ('gov.uk', 'UK Government', 'government', 90, 'GB', 'en'),
  ('canada.ca', 'Government of Canada', 'government', 90, 'CA', 'en')
ON CONFLICT (domain) DO NOTHING;

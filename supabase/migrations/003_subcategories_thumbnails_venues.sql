-- ════════════════════════════════════════════════════════════════════════════
-- GSAC — Migration 003: subcategories, course thumbnails, venue + training type
-- ----------------------------------------------------------------------------
-- RUN THIS ONCE in Supabase → SQL Editor on your EXISTING project.
-- (Brand-new project? Run supabase/schema.sql instead — it already includes this.)
-- Safe to re-run. Nothing is deleted; existing courses are back-filled
-- (venues from `location`, delivery_modes from `format`).
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 1 ── SUBCATEGORIES (Category → Subcategory → Course)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subcategories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  sort_order  INT DEFAULT 0,
  published   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT subcategories_category_slug_key UNIQUE (category_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories (category_id);

INSERT INTO subcategories (category_id, name, slug, description, sort_order)
SELECT c.id, s.name, s.slug, s.description, s.sort_order
FROM (VALUES
  ('leadership-management','Strategic Leadership','strategic-leadership','Vision, strategy and executive decision-making for senior leaders.',1),
  ('leadership-management','Management Skills','management-skills','Core people-management and supervisory skills for new and experienced managers.',2),
  ('leadership-management','Change & Team Management','change-team-management','Lead change, build high-performing teams and manage performance.',3),
  ('leadership-management','Executive & Personal Effectiveness','executive-personal-effectiveness','Communication, EQ and productivity for executives and assistants.',4),
  ('finance-hr','Financial Management & Accounting','financial-management-accounting','Budgeting, reporting, IFRS and financial control.',1),
  ('finance-hr','Human Resource Management','human-resource-management','Talent, performance, employee relations and HR strategy.',2),
  ('finance-hr','Payroll, Tax & Compensation','payroll-tax-compensation','Payroll administration, taxation and reward management.',3),
  ('finance-hr','Audit & Internal Control','audit-internal-control','Internal audit, controls and assurance.',4),
  ('monitoring-evaluation','M&E Fundamentals','me-fundamentals','Core monitoring, evaluation and learning concepts and tools.',1),
  ('monitoring-evaluation','Advanced M&E & Impact Evaluation','advanced-me-impact-evaluation','Advanced evaluation designs, mixed methods and impact assessment.',2),
  ('monitoring-evaluation','Data Collection & Analysis','data-collection-analysis','Survey design, mobile data collection, SPSS, Stata and R.',3),
  ('monitoring-evaluation','Results-Based Management','results-based-management','Results frameworks, indicators and performance reporting.',4),
  ('technology-innovation','AI & Machine Learning','ai-machine-learning','Practical AI and machine learning for business.',1),
  ('technology-innovation','Data Analytics & Business Intelligence','data-analytics-bi','Power BI, Excel, SQL and data-driven decision making.',2),
  ('technology-innovation','Cybersecurity & Data Protection','cybersecurity-data-protection','Information security, privacy and data protection compliance.',3),
  ('technology-innovation','Software & Cloud','software-cloud','Cloud, software delivery and IT service management.',4),
  ('procurement-supply-chain','Procurement & Contracting','procurement-contracting','Public and private procurement, tendering and contract management.',1),
  ('procurement-supply-chain','Supply Chain Strategy','supply-chain-strategy','End-to-end supply chain design, sourcing and optimisation.',2),
  ('procurement-supply-chain','Logistics & Warehousing','logistics-warehousing','Transport, distribution, warehousing and fleet management.',3),
  ('procurement-supply-chain','Inventory & Stores Management','inventory-stores-management','Stock control, stores and materials management.',4),
  ('project-management','Project Planning & Control','project-planning-control','Plan, schedule, budget and control projects.',1),
  ('project-management','Agile & Scrum','agile-scrum','Agile, Scrum and adaptive delivery.',2),
  ('project-management','Programme & Portfolio Management','programme-portfolio-management','Manage programmes and portfolios for strategic value.',3),
  ('project-management','PMP & Certification Prep','pmp-certification-prep','Exam-focused preparation for professional certifications.',4),
  ('risk-compliance','Risk Management','risk-management','Enterprise risk, ISO 31000 and risk culture.',1),
  ('risk-compliance','Governance & Compliance','governance-compliance','Corporate governance, regulatory compliance and ethics.',2),
  ('risk-compliance','Quality Management','quality-management','ISO 9001, quality assurance and continuous improvement.',3),
  ('risk-compliance','Fraud & Anti-Corruption','fraud-anti-corruption','Fraud prevention, detection and investigation.',4),
  ('digital-transformation','Digital Strategy','digital-strategy','Digital roadmaps and leadership of transformation programmes.',1),
  ('digital-transformation','Process Automation','process-automation','Workflow, RPA and low-code automation.',2),
  ('digital-transformation','Digital Government','digital-government','E-government and digital public services.',3),
  ('digital-transformation','Innovation Management','innovation-management','Design thinking, product innovation and lean start-up methods.',4),
  ('health-public-sector','Public Health Management','public-health-management','Health programme and health systems management.',1),
  ('health-public-sector','Health Informatics','health-informatics','DHIS2, electronic records and health data use.',2),
  ('health-public-sector','Public Financial Management','public-financial-management','Budgeting, PFM reforms and accountability in government.',3),
  ('health-public-sector','Policy & Governance','policy-governance','Policy analysis, development and public-sector governance.',4),
  ('geospatial','GIS & Mapping','gis-mapping','ArcGIS, QGIS and cartography.',1),
  ('geospatial','Remote Sensing','remote-sensing','Satellite imagery analysis and Earth observation.',2),
  ('geospatial','Drone & UAV Mapping','drone-uav-mapping','Drone data capture and photogrammetry.',3),
  ('geospatial','Spatial Data Analysis','spatial-data-analysis','Spatial statistics, modelling and web mapping.',4)
) AS s(cat_slug, name, slug, description, sort_order)
JOIN categories c ON c.slug = s.cat_slug
ON CONFLICT (category_id, slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- 2 ── NEW COURSE COLUMNS
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subcategory        TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subcategory_slug   TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_description  TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_audience    TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail          TEXT;      -- public image URL
ALTER TABLE courses ADD COLUMN IF NOT EXISTS venues             TEXT[];    -- venue (city) names the course runs in
ALTER TABLE courses ADD COLUMN IF NOT EXISTS delivery_modes     TEXT[];    -- In-Person | Virtual | In-House

-- Back-fill delivery_modes from the old free-text `format`
UPDATE courses c SET delivery_modes = COALESCE(NULLIF(ARRAY(
  SELECT m FROM (VALUES ('In-Person'),('Virtual'),('In-House')) t(m)
  WHERE position(lower(m) in lower(COALESCE(c.format, ''))) > 0
), '{}'), ARRAY['In-Person'])
WHERE c.delivery_modes IS NULL;

-- Back-fill venues from the old free-text `location` ("Nairobi, Dubai, London")
UPDATE courses c SET venues = COALESCE(ARRAY(
  SELECT v.name FROM venues v
  WHERE position(lower(v.name) in lower(COALESCE(c.location, ''))) > 0
  ORDER BY v.sort_order
), '{}')
WHERE c.venues IS NULL;

ALTER TABLE courses ALTER COLUMN delivery_modes SET DEFAULT ARRAY['In-Person','Virtual'];
ALTER TABLE courses ALTER COLUMN venues         SET DEFAULT '{}';

-- Put the sample courses under a subcategory
UPDATE courses SET subcategory='Advanced M&E & Impact Evaluation', subcategory_slug='advanced-me-impact-evaluation' WHERE slug='advanced-monitoring-evaluation'    AND subcategory_slug IS NULL;
UPDATE courses SET subcategory='Strategic Leadership',             subcategory_slug='strategic-leadership'            WHERE slug='global-leadership'                 AND subcategory_slug IS NULL;
UPDATE courses SET subcategory='PMP & Certification Prep',         subcategory_slug='pmp-certification-prep'          WHERE slug='project-management-professional'  AND subcategory_slug IS NULL;
UPDATE courses SET subcategory='Financial Management & Accounting',subcategory_slug='financial-management-accounting' WHERE slug='financial-management-reporting'   AND subcategory_slug IS NULL;
UPDATE courses SET subcategory='AI & Machine Learning',            subcategory_slug='ai-machine-learning'             WHERE slug='ai-machine-learning-business'     AND subcategory_slug IS NULL;
UPDATE courses SET subcategory='Supply Chain Strategy',            subcategory_slug='supply-chain-strategy'           WHERE slug='supply-chain-procurement'         AND subcategory_slug IS NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- 3 ── ENROLLMENTS remember the venue the client picked
--      (`format` already stores the training type: In-Person / Virtual / In-House)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS venue TEXT;

-- ─────────────────────────────────────────────────────────────────────────
-- 4 ── SECURITY for subcategories
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_subcategories" ON subcategories;
CREATE POLICY "public_read_subcategories" ON subcategories FOR SELECT USING (published = TRUE);
DROP POLICY IF EXISTS "admin_all_subcategories" ON subcategories;
CREATE POLICY "admin_all_subcategories"   ON subcategories FOR ALL USING (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 5 ── STORAGE: public bucket for course thumbnails (admin-only writes)
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-thumbnails', 'course-thumbnails', TRUE, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE
  SET public = TRUE, file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

DROP POLICY IF EXISTS "course_thumbs_public_read" ON storage.objects;
CREATE POLICY "course_thumbs_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-thumbnails');
DROP POLICY IF EXISTS "course_thumbs_admin_insert" ON storage.objects;
CREATE POLICY "course_thumbs_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'course-thumbnails' AND public.is_admin());
DROP POLICY IF EXISTS "course_thumbs_admin_update" ON storage.objects;
CREATE POLICY "course_thumbs_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'course-thumbnails' AND public.is_admin());
DROP POLICY IF EXISTS "course_thumbs_admin_delete" ON storage.objects;
CREATE POLICY "course_thumbs_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'course-thumbnails' AND public.is_admin());

COMMIT;

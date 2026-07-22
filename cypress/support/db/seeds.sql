SET search_path TO variamos;

-- ============================================================================
-- TABLE: user
-- ============================================================================

INSERT INTO "user" ("id", "user", "name", "email", "country_code", "is_enabled", "is_deleted", "created_at", "last_login", "password") VALUES
(
    '42bceea2-ea98-4150-8493-7c9db3f658ac',
    'Alice Martin',
    'Alice Martin',
    'alice.martin@example.com',
    'FR',
    true,
    false,
    '2026-05-29 08:00:00+00',
    '2026-05-29 10:30:00+00',
    '$2b$10$Whuu2ydsuycABm8PYr1w1OSbFRdRuMx0zfi5bY.artPYDs3CWexKq'
),
(
    '53cdeea3-fb09-4251-9504-8d0ec4f769bd',
    'John Doe',
    'John Doe',
    'john.doe@example.com',
    'CO',
    true,
    true,
    '2026-06-15 09:00:00+00',
    '2026-06-15 14:15:00+00',
    '$2b$10$Whuu2ydsuycABm8PYr1w1OSbFRdRuMx0zfi5bY.artPYDs3CWexKq'
),
(
    '64deeea4-0c1a-5362-a615-9e1fd5f87ace',
    'Bob Smith',
    'Bob Smith',
    'bob.smith@example.com',
    'CL',
    false,
    false,
    '2026-07-01 10:00:00+00',
    NULL,
    '$2b$10$Whuu2ydsuycABm8PYr1w1OSbFRdRuMx0zfi5bY.artPYDs3CWexKq'
),
(
    '75effea5-1d2b-6473-b726-af2fe6f98bdf',
    'Jane Watson',
    'Jane Watson',
    'jane.watson@example.com',
    NULL,
    false,
    true,
    '2026-07-10 11:00:00+00',
    '2026-07-10 12:00:00+00',
    '$2b$10$Whuu2ydsuycABm8PYr1w1OSbFRdRuMx0zfi5bY.artPYDs3CWexKq'
)
ON CONFLICT (id) DO NOTHING;
SET search_path TO variamos;

-- ============================================================================
-- TABLE: language
-- ============================================================================

INSERT INTO "language" ("id", "name", "abstractSyntax", "concreteSyntax", "type", "stateAccept", "semantics", "created_at", "updated_at") VALUES
-- 1. Active DOMAIN language with updated_at timestamp
(1, 'FeatureModel',
 '{"elements": {}, "restrictions": {}, "relationships": {}}'::jsonb,
 '{"elements": {}, "relationships": {}}'::jsonb,
 'DOMAIN', 'ACTIVE', '{}'::jsonb,
 '2026-01-15 10:00:00+00', '2026-02-01 14:30:00+00'),

-- 2. Active SCOPE language without updates (updated_at is NULL)
(2, 'SmartCityScope',
 '{"elements": {}, "restrictions": {}, "relationships": {}}'::jsonb,
 '{"elements": {}, "relationships": {}}'::jsonb,
 'SCOPE', 'ACTIVE', '{}'::jsonb,
 '2026-03-10 08:15:00+00', NULL),

-- 3. APPLICATION language pending approval (PENDING)
(3, 'ECommerceApp',
 '{"elements": {}, "restrictions": {}, "relationships": {}}'::jsonb,
 '{"elements": {}, "restrictions": {}}'::jsonb,
 'APPLICATION', 'PENDING', '{}'::jsonb,
 '2026-06-01 11:20:00+00', NULL),

-- 4. Soft-deleted DOMAIN language (DELETED)
(4, 'LegacyDomain',
 '{"elements": {}, "restrictions": {}, "relationships": {}}'::jsonb,
 '{"elements": {}, "relationships": {}}'::jsonb,
 'DOMAIN', 'DELETED', '{}'::jsonb,
 '2025-11-01 09:00:00+00', '2026-01-10 16:00:00+00');

-- Reset auto-increment sequence to start clean after ID 4
SELECT setval('"variamos"."languageRegistry_id_seq"', (SELECT MAX(id) FROM "language"));
SET search_path TO variamos;

-- ============================================================================
-- TABLE: project
-- ============================================================================

INSERT INTO "project" (
    "id",
    "project",
    "name",
    "template",
    "configuration",
    "description",
    "source",
    "author",
    "date",
    "type_models",
    "owner_id",
    "is_collaborative"
) VALUES
-- 1. Standard collaborative project owned by User 1 (Alice Martin)
(
    '8f3c7e91-3a1b-4d5e-8f2a-1b3c4d5e6f7a',
    NULL,
    'Smart Home Automation System',
    FALSE,
    NULL,
    'A product line architecture for modern IoT smart home devices.',
    'https://github.com/variamos/smart-home-demo',
    'Alice Martin',
    '2026-02-10 09:30:00+00',
    NULL,
    '42bceea2-ea98-4150-8493-7c9db3f658ac',
    TRUE
),

-- 2. Template project owned by User 2 (John Doe)
(
    '9a4d8f02-4b2c-5e6f-9a3b-2c4d5e6f7a8b',
    NULL,
    'E-Commerce Product Line Template',
    TRUE,
    NULL,
    'Base template for variability modeling in web store platforms.',
    NULL,
    'John Doe',
    '2026-03-01 14:15:00+00',
    NULL,
    '53cdeea3-fb09-4251-9504-8d0ec4f769bd',
    FALSE
),

-- 3. Non-collaborative personal project owned by User 3 (Bob Smith) with NULL description and author
(
    '0b5e9a13-5c3d-6f7a-0b4c-3d5e6f7a8b9c',
    NULL,
    'Automotive ECU Manager',
    FALSE,
    NULL,
    NULL,
    'https://gitlab.com/automotive/ecu-variability',
    NULL,
    '2026-04-18 11:00:00+00',
    NULL,
    '64deeea4-0c1a-5362-a615-9e1fd5f87ace',
    FALSE
),

-- 4. Template collaborative project owned by User 4 (Jane Watson)
(
    '1c6f0b24-6d4e-7a8b-1c5d-4e6f7a8b9c0d',
    NULL,
    'Microservice Micro-Variability Baseline',
    TRUE,
    NULL,
    'Reference architecture for modular backend microservices.',
    NULL,
    'Jane Watson',
    '2026-05-22 16:45:00+00',
    NULL,
    '75effea5-1d2b-6473-b726-af2fe6f98bdf',
    TRUE
);
SET search_path TO variamos;

-- ============================================================================
-- TABLE: user_language
-- ============================================================================

INSERT INTO "user_language" ("user_id", "language_id", "access_level") VALUES
-- User 1 is the OWNER of FeatureModel (1) and SmartCityScope (2)
('42bceea2-ea98-4150-8493-7c9db3f658ac', 1, 'OWNER'),
('42bceea2-ea98-4150-8493-7c9db3f658ac', 2, 'OWNER'),

-- User 2 has SHARED access to FeatureModel (1) and owns ECommerceApp (3)
('53cdeea3-fb09-4251-9504-8d0ec4f769bd', 1, 'SHARED'),
('53cdeea3-fb09-4251-9504-8d0ec4f769bd', 3, 'OWNER'),

-- User 3 owns the LegacyDomain (4) and has SHARED access to ECommerceApp (3)
('64deeea4-0c1a-5362-a615-9e1fd5f87ace', 4, 'OWNER'),
('64deeea4-0c1a-5362-a615-9e1fd5f87ace', 3, 'SHARED'),

-- User 4 has SHARED access to SmartCityScope (2)
('75effea5-1d2b-6473-b726-af2fe6f98bdf', 2, 'SHARED');
SET search_path TO variamos;

-- ============================================================================
-- TABLE: user_project
-- ============================================================================

INSERT INTO "user_project" ("user_id", "project_id", "role") VALUES
-- Smart Home Automation System (Owned by Alice, collaborated with John and Jane)
('42bceea2-ea98-4150-8493-7c9db3f658ac', '8f3c7e91-3a1b-4d5e-8f2a-1b3c4d5e6f7a', 'owner'),
('53cdeea3-fb09-4251-9504-8d0ec4f769bd', '8f3c7e91-3a1b-4d5e-8f2a-1b3c4d5e6f7a', 'editor'),
('75effea5-1d2b-6473-b726-af2fe6f98bdf', '8f3c7e91-3a1b-4d5e-8f2a-1b3c4d5e6f7a', 'editor'),

-- E-Commerce Product Line Template (Owned by John)
('53cdeea3-fb09-4251-9504-8d0ec4f769bd', '9a4d8f02-4b2c-5e6f-9a3b-2c4d5e6f7a8b', 'owner'),

-- Automotive ECU Manager (Owned by Bob)
('64deeea4-0c1a-5362-a615-9e1fd5f87ace', '0b5e9a13-5c3d-6f7a-0b4c-3d5e6f7a8b9c', 'owner'),

-- Microservice Micro-Variability Baseline (Owned by Jane, collaborated with Alice)
('75effea5-1d2b-6473-b726-af2fe6f98bdf', '1c6f0b24-6d4e-7a8b-1c5d-4e6f7a8b9c0d', 'owner'),
('42bceea2-ea98-4150-8493-7c9db3f658ac', '1c6f0b24-6d4e-7a8b-1c5d-4e6f7a8b9c0d', 'editor');
SET search_path TO variamos;

-- ============================================================================
-- TABLE: model
-- ============================================================================

INSERT INTO "model" (
    "id",
    "project_id",
    "product_line_id",
    "engineering_type",
    "name",
    "type",
    "description",
    "author",
    "source",
    "language_id",
    "model"
) VALUES
-- 1. Feature model with attributes (Smart Home project)
(
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    '8f3c7e91-3a1b-4d5e-8f2a-1b3c4d5e6f7a',
    'f0e9d8c7-b6a5-4321-9876-543210fedcba',
    'domainEngineering',
    'Core Smart Home Features',
    'Feature model with attributes',
    'Main feature model capturing variability and numerical attributes for smart home devices.',
    'Alice Martin',
    'https://github.com/variamos/smart-home-demo',
    1,
    '{"elements": {}, "relationships": {}, "attributes": {}}'::jsonb
),

-- 2. Domain Requirement-AC (Smart Home scope)
(
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    '8f3c7e91-3a1b-4d5e-8f2a-1b3c4d5e6f7a',
    'f0e9d8c7-b6a5-4321-9876-543210fedcba',
    'scope',
    'Smart Home Domain Requirements',
    'Domain Requirement-AC',
    'High-level domain requirements and adaptability criteria.',
    'Alice Martin',
    NULL,
    2,
    '{"elements": {}, "relationships": {}}'::jsonb
),

-- 3. Feature model without attributes (E-Commerce project)
(
    'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
    '9a4d8f02-4b2c-5e6f-9a3b-2c4d5e6f7a8b',
    'e9d8c7b6-a543-2109-8765-43210fedcba9',
    'domainEngineering',
    'E-Commerce Basic Features',
    'Feature model without attributes',
    'Simple boolean feature model for core store functionality.',
    'John Doe',
    NULL,
    1,
    '{"elements": {}, "relationships": {}}'::jsonb
),

-- 4. Feature model with attributes, without optional fields (Automotive ECU project)
(
    'd4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a',
    '0b5e9a13-5c3d-6f7a-0b4c-3d5e6f7a8b9c',
    'd8c7b6a5-4321-0987-6543-210fedcba987',
    'domainEngineering',
    'ECU Signal Mapping Model',
    'Feature model with attributes',
    NULL,
    NULL,
    'https://gitlab.com/automotive/ecu-variability',
    3,
    '{"elements": {}}'::jsonb
);
SET search_path TO variamos;

-- ============================================================================
-- TABLE: model_configuration
-- ============================================================================

INSERT INTO "model_configuration" (
    "id",
    "model_id",
    "name",
    "configuration"
) VALUES
-- 1. Configuration for Smart Home Core Features Model
(
    'e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Minimal Security Setup',
    '{"id": "e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b", "name": "Minimal Security Setup", "features": ["motion_sensor", "alarm_siren"]}'::jsonb
),

-- 2. Full setup configuration for Smart Home Core Features Model
(
    'f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Premium Smart Home Package',
    '{"id": "f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c", "name": "Premium Smart Home Package", "features": ["motion_sensor", "alarm_siren", "smart_lock", "camera_feed"]}'::jsonb
),

-- 3. Configuration for E-Commerce Basic Features Model
(
    'a7b8c9d0-e1f2-0a3b-4c5d-6e7f8a9b0c1d',
    'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
    'Standard Storefront Config',
    '{"id": "a7b8c9d0-e1f2-0a3b-4c5d-6e7f8a9b0c1d", "name": "Standard Storefront Config", "features": ["stripe_payment", "inventory_sync"]}'::jsonb
),

-- 4. Empty configuration for ECU Signal Mapping Model
(
    'b8c9d0e1-f2a3-1b4c-5d6e-7f8a9b0c1d2e',
    'd4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a',
    'Base ECU Profile',
    '{"id": "b8c9d0e1-f2a3-1b4c-5d6e-7f8a9b0c1d2e", "name": "Base ECU Profile", "features": []}'::jsonb
);
SET search_path TO variamos;

-- ============================================================================
-- TABLE: bugs
-- ============================================================================

INSERT INTO "bugs" (
    "id",
    "title",
    "description",
    "priority",
    "category",
    "status",
    "reporter_email",
    "created_by_id",
    "github_repo",
    "git_issue_number",
    "github_creator",
    "github_html_url",
    "github_assignee",
    "github_created_at",
    "created_at",
    "updated_at"
) VALUES
-- 1. Open bug on GitHub (VariaMosLanguages) with high priority
(
    'c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c',
    'Language grammar parser crashes on empty JSON',
    'When loading a language with an empty abstractSyntax, the editor throws an unhandled exception.',
    'high',
    'Editor',
    'open',
    'alice.martin@example.com',
    '42bceea2-ea98-4150-8493-7c9db3f658ac',
    'variamosple/VariaMosLanguages',
    102,
    'alice-m',
    'https://github.com/variamosple/VariaMosLanguages/issues/102',
    'john-dev',
    '2026-06-10 10:15:00+00',
    '2026-06-10 10:00:00+00',
    '2026-06-12 14:30:00+00'
),

-- 2. Pending bug (Not yet synced to GitHub, github_repo is NULL)
(
    'd2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d',
    'UI overlap on low resolution screens',
    'No description provided.',
    'low',
    'Other',
    'pending',
    'bob.smith@example.com',
    '64deeea4-0c1a-5362-a615-9e1fd5f87ace',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-07-01 08:45:00+00',
    '2026-07-01 08:45:00+00'
),

-- 3. Closed bug on GitHub (VariaMosPLE)
(
    'e3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e',
    'Export to XML fails for complex feature models',
    'The export utility drops child relationships when attributes are set.',
    'medium',
    'Editor',
    'closed',
    'john.doe@example.com',
    '53cdeea3-fb09-4251-9504-8d0ec4f769bd',
    'variamosple/VariaMosPLE',
    45,
    'johndoe-git',
    'https://github.com/variamosple/VariaMosPLE/issues/45',
    'alice-m',
    '2026-05-15 11:20:00+00',
    '2026-05-14 16:00:00+00',
    '2026-05-20 09:10:00+00'
),

-- 4. Open bug reported anonymously (created_by_id and reporter_email NULL) on VariaMosAdmin
(
    'f4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f',
    'Admin dashboard metrics query timeout',
    'The yearly visits metric query takes more than 10 seconds to execute.',
    'medium',
    'Other',
    'open',
    NULL,
    NULL,
    'variamosple/VariaMosAdmin',
    12,
    'bot-reporter',
    'https://github.com/variamosple/VariaMosAdmin/issues/12',
    NULL,
    '2026-07-15 14:00:00+00',
    '2026-07-15 13:50:00+00',
    '2026-07-15 14:00:00+00'
);

-- Adminer 5.4.2 PostgreSQL 14.8 dump


DROP TABLE IF EXISTS "permission";
DROP SEQUENCE IF EXISTS "variamos".permission_id_seq;
CREATE SEQUENCE "variamos".permission_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "variamos"."permission" (
    "id" integer DEFAULT nextval('permission_id_seq') NOT NULL,
    "name" text NOT NULL,
    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

INSERT INTO "permission" ("id", "name") VALUES
(4,	'users::query'),
(5,	'users::update'),
(6,	'roles::query'),
(7,	'roles::update'),
(8,	'roles::create'),
(9,	'roles::delete'),
(10,	'permissions::create'),
(11,	'permissions::query'),
(12,	'permissions::delete'),
(13,	'permissions::update'),
(14,	'micro-services::query'),
(15,	'metrics::query'),
(16,	'micro-services::update'),
(17,	'users::delete'),
(18,	'my-account::query'),
(19,	'my-account::update'),
(20,	'languages::create'),
(21,	'languages::delete'),
(22,	'languages::query'),
(23,	'languages::update'),
(24,	'admin::projects::update'),
(25,	'admin::projects::query'),
(26,	'admin::projects::delete'),
(27,	'admin::models::query'),
(28,	'admin::models::update'),
(29,	'admin::models::delete'),
(30,	'admin::languages::delete'),
(31,	'admin::languages::update'),
(32,	'admin::languages::query'),
(33,	'bugs::query'),
(3,	'product-line::create'),
(2,	'languages::approve'),
(1,	'deprecated-duplicate-languages::create'),
(34,	'languages::get::own'),
(35,	'languages::get::public'),
(36,	'languages::get::all'),
(37,	'languages::update::all'),
(38,	'languages::update::own'),
(39,	'languages::publish::all'),
(40,	'languages::delete::all'),
(41,	'languages::delete::own'),
(42,	'languages::manage-collaborators::own'),
(43,	'languages::manage-collaborators::all');

DROP TABLE IF EXISTS "role";
CREATE TABLE "variamos"."role" (
    "id" integer DEFAULT GENERATED ALWAYS AS IDENTITY NOT NULL,
    "name" text NOT NULL,
    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

INSERT INTO "role" ("id", "name") VALUES
(1,	'Administrator'),
(2,	'Language developer'),
(3,	'Product line designer'),
(4,	'Language director'),
(6,	'Guest');

DROP TABLE IF EXISTS "role_permission";
CREATE TABLE "variamos"."role_permission" (
    "role_id" integer NOT NULL,
    "permission_id" integer NOT NULL,
    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id", "permission_id")
)
WITH (oids = false);

INSERT INTO "role_permission" ("role_id", "permission_id") VALUES
(2,	1),
(4,	2),
(2,	3),
(3,	3),
(4,	3),
(4,	1),
(1,	8),
(1,	9),
(1,	6),
(1,	7),
(1,	10),
(1,	12),
(1,	11),
(1,	13),
(1,	4),
(1,	5),
(1,	15),
(1,	14),
(1,	16),
(1,	17),
(2,	18),
(2,	19),
(2,	20),
(2,	22),
(2,	23),
(2,	21),
(6,	22),
(1,	26),
(1,	25),
(1,	24),
(1,	27),
(1,	29),
(1,	28),
(1,	30),
(1,	32),
(1,	31),
(1,	33),
(1,	40),
(1,	41),
(1,	36),
(1,	34),
(1,	35),
(1,	39),
(1,	37),
(1,	38),
(2,	41),
(2,	34),
(2,	35),
(2,	38),
(3,	35),
(3,	34),
(4,	40),
(4,	41),
(4,	36),
(4,	34),
(4,	39),
(4,	37),
(4,	38),
(6,	35),
(1,	42),
(2,	42),
(3,	42),
(4,	42),
(1,	43);

ALTER TABLE ONLY "variamos"."role_permission" ADD CONSTRAINT "permission_fkey" FOREIGN KEY (permission_id) REFERENCES permission(id);
ALTER TABLE ONLY "variamos"."role_permission" ADD CONSTRAINT "role_fkey" FOREIGN KEY (role_id) REFERENCES role(id);

-- 2026-07-22 19:46:30 UTC

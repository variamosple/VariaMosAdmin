-- Adminer 5.4.2 PostgreSQL 14.8 dump

-- \connect "VariamosDB";

CREATE SCHEMA IF NOT EXISTS "variamos";
SET search_path TO "variamos", "public";

DROP TYPE IF EXISTS "enum_bugs_priority";;
CREATE TYPE "enum_bugs_priority" AS ENUM ('low', 'medium', 'high');

DROP FUNCTION IF EXISTS "get_daily_unique_visits_metrics";;
CREATE FUNCTION "get_daily_unique_visits_metrics" (IN "startdate" date, IN "enddate" date) RETURNS TABLE("char_data" json) LANGUAGE plpgsql AS '
DECLARE
BEGIN
    RETURN QUERY WITH
    daily_visits AS (
        SELECT page_id, unique_visits, visits, visits_date
        FROM variamos.visits_summary
		WHERE visits_date BETWEEN startDate AND endDate
        ORDER BY visits_date, page_id ASC
    )
    SELECT json_build_object(
		''id'', id,
		''title'', title,
		''chartType'', chart_type,
		''defaultFilter'', default_filter,
		''labelKey'', label_key,
		''filters'', filters,
		''data'', data
	)
	FROM (
		SELECT
		''daily_unique_visits'' AS id,
		''Daily Unique Visits'' AS title,
		''line'' AS chart_type,
		''date'' as label_key,
		''page'' AS default_filter,
		''["page"]''::json AS filters,
		(
			SELECT json_agg(json_build_object(''page'', page_id, ''count'', unique_visits, ''date'', visits_date))
			FROM daily_visits
		) AS data
	) AS chart_data;

END;
';

DROP FUNCTION IF EXISTS "get_daily_visits_metrics";;
CREATE FUNCTION "get_daily_visits_metrics" (IN "startdate" date, IN "enddate" date) RETURNS TABLE("char_data" json) LANGUAGE plpgsql AS '
DECLARE
BEGIN
    RETURN QUERY WITH
    daily_visits AS (
        SELECT page_id, unique_visits, visits, visits_date
        FROM variamos.visits_summary
        WHERE visits_date BETWEEN startDate AND endDate
        ORDER BY visits_date, page_id ASC
    )
    SELECT json_build_object(
        ''id'', id,
		''title'', title,
		''chartType'', chart_type,
		''defaultFilter'', default_filter,
		''labelKey'', label_key,
		''filters'', filters,
		''data'', data
	)
	FROM (
		SELECT 
        ''daily_visits'' AS id,
		''Daily Visits'' AS title,
		''line'' AS chart_type,
		''date'' as label_key,
		''page'' AS default_filter,
		''["page"]''::json AS filters,
		(
			SELECT json_agg(json_build_object(''page'', page_id, ''count'', visits, ''date'', visits_date))
			FROM daily_visits
		) AS data
	) AS chart_data;

END;
';

DROP FUNCTION IF EXISTS "get_metrics";;
CREATE FUNCTION "get_metrics" () RETURNS json LANGUAGE plpgsql AS '
DECLARE
    metrics_data JSON;
    dailyStartDate DATE := current_date - INTERVAL ''3 months'';
    dailyEndDate DATE := current_date;
    monthlyStartDate DATE := current_date - INTERVAL ''24 months'';
BEGIN
    SELECT json_agg(char_data)
    INTO metrics_data
    FROM (
        SELECT char_data FROM variamos.get_yearly_visits_metrics()
        UNION ALL
        SELECT char_data FROM variamos.get_daily_visits_metrics(dailyStartDate, dailyEndDate)
        UNION ALL
        SELECT char_data FROM variamos.get_daily_unique_visits_metrics(dailyStartDate, dailyEndDate)
        UNION ALL 
        SELECT char_data FROM variamos.get_monthly_visits_metrics(monthlyStartDate, dailyEndDate)
        UNION ALL 
        SELECT char_data FROM variamos.get_top_visited_pages_metrics()
    ) as data;
    
    RETURN metrics_data;
END;
';

DROP FUNCTION IF EXISTS "get_monthly_visits_metrics";;
CREATE FUNCTION "get_monthly_visits_metrics" (IN "startdate" date, IN "enddate" date) RETURNS TABLE("char_data" json) LANGUAGE plpgsql AS '
DECLARE
BEGIN
    RETURN QUERY WITH
   	monthly_visits AS (
        SELECT
            page_id,
            TO_CHAR(visits_date, ''YYYY-MM'') AS month,	
            SUM(visits) AS total_visits
        FROM variamos.visits_summary
		WHERE visits_date BETWEEN startDate AND endDate
        GROUP BY page_id, month
        ORDER BY page_id, month
    )
    SELECT json_build_object(
		''id'', id,
		''title'', title,
		''chartType'', chart_type,
		''defaultFilter'', default_filter,
		''labelKey'', label_key,
		''filters'', filters,
		''data'', data
	)
	FROM (
		SELECT 
		''monthly_visits'' AS id,
		''Monthly Visits'' AS title,
		''line'' AS chart_type,
		''date'' as label_key,
		''page'' AS default_filter,
		''["page"]''::json AS filters,
		(
			SELECT json_agg(json_build_object(''page'', page_id, ''count'', total_visits, ''date'', month))
			FROM monthly_visits
		) AS data
	) AS chart_data;

END;
';

DROP FUNCTION IF EXISTS "get_top_visited_pages_metrics";;
CREATE FUNCTION "get_top_visited_pages_metrics" () RETURNS TABLE("char_data" json) LANGUAGE plpgsql AS '
DECLARE
BEGIN
    RETURN QUERY WITH
   	top_visited_pages AS (
        SELECT
            page_id,
            SUM(visits) AS total_visits
        FROM variamos.visits_summary
        WHERE visits_date > current_date - INTERVAL ''3 months''
        GROUP BY page_id
        ORDER BY total_visits DESC, page_id
		LIMIT 10
    )
    SELECT json_build_object(
		''id'', id,
		''title'', title,
		''chartType'', chart_type,
		''defaultFilter'', default_filter,
		''labelKey'', label_key,
		''filters'', filters,
		''data'', data
	)
	FROM (
		SELECT 
		''top_visited_pages'' AS id,
		''Top visited pages (Last 3 Months)'' AS title,
		''doughnut'' AS chart_type,
		''page'' as label_key,
		''page'' AS default_filter,
		''["page"]''::json AS filters,
		(
			SELECT json_agg(json_build_object(''page'', page_id, ''count'', total_visits))
			FROM top_visited_pages
		) AS data
	) AS chart_data;

END;
';

DROP FUNCTION IF EXISTS "get_yearly_visits_metrics";;
CREATE FUNCTION "get_yearly_visits_metrics" () RETURNS TABLE("char_data" json) LANGUAGE plpgsql AS '
DECLARE
BEGIN
    RETURN QUERY WITH
   	yearly_visits  AS (
        SELECT COALESCE(c.name, ''NO COUNTRY'') as country_name
			,EXTRACT(YEAR FROM yvs.visit_year)::TEXT as visit_year
			,yvs.count AS visits_count
		FROM variamos.yearly_visits_summary yvs
		LEFT JOIN variamos.country AS c ON (c.code = yvs.country_code)
		WHERE yvs.visit_year = DATE_TRUNC(''year'', current_date) - INTERVAL ''1 years''
		UNION ALL (
			SELECT COALESCE(c.name, ''NO COUNTRY'') as country_name
				,EXTRACT(YEAR FROM uv.visit_date)::TEXT as visit_year
				,count(1) as visits_count 
			FROM variamos.user_visit AS uv
			LEFT JOIN variamos.country AS c ON (c.code = uv.country_code)
			GROUP BY c.name, uv.visit_date
			ORDER BY uv.visit_date DESC , c.name ASC
		)
    )
    SELECT json_build_object(
		''id'', id,
		''title'', title,
		''chartType'', chart_type,
		''defaultFilter'', default_filter,
		''labelKey'', label_key,
		''filters'', filters,
		''data'', data
	)
	FROM (
		SELECT 
		''yearly_visits'' AS id,
		''Yearly visits'' AS title,
		''geo'' AS chart_type,
		''Country'' as label_key,
		EXTRACT(YEAR FROM CURRENT_DATE)::TEXT AS default_filter,
		NULL AS filters,
		json_object_agg(visit_year, data_array) AS data
		FROM (
			SELECT 
				visit_year,
				array_agg(json_build_array(country_name, visits_count)) AS data_array
			FROM yearly_visits
			GROUP BY visit_year
		) AS metric_data
	) AS chart_data;

END;
';

DROP FUNCTION IF EXISTS "insert_user_role";;
CREATE FUNCTION "insert_user_role" () RETURNS trigger LANGUAGE plpgsql AS '
BEGIN
    INSERT INTO variamos.user_role (user_id, role_id) VALUES (NEW.id, 2);
	INSERT INTO variamos.user_role (user_id, role_id) VALUES (NEW.id, 3);
	
    RETURN NEW;
END;
';

DROP PROCEDURE IF EXISTS "sp_add_user_language";;
CREATE PROCEDURE "sp_add_user_language" (IN "user_name" character varying, IN "language_name" character varying) LANGUAGE sql AS '
insert into variamos.user_language(user_id, language_id)
select u.id, l.id
from variamos.user u, variamos.language l
where u.email=user_name
and l.name ilike language_name; 

';

DROP PROCEDURE IF EXISTS "sp_add_user_role";;
CREATE PROCEDURE "sp_add_user_role" (IN "user_name" character varying, IN "rol_name" character varying) LANGUAGE sql AS '
insert into variamos.user_role(user_id, role_id)
select u.id, l.id
from variamos.user u, variamos.role l
where u.email=user_name
and l.name ilike rol_name; 

';

DROP FUNCTION IF EXISTS "sp_view_languages";;
CREATE FUNCTION "sp_view_languages" (IN "p_type" text, IN "p_user_id" text, OUT "id" integer, OUT "name" text, OUT "type" text) RETURNS record LANGUAGE sql AS '

SELECT l.id, l.name, l.type
FROM variamos.language l
left join variamos.user_language ul on ul.language_id=l.id
where l.type=p_type
and l."stateAccept"=''ACTIVE'' or (l."stateAccept"=''PENDING'' and ul.user_id=p_user_id)
order by l.type, l.name

';

DROP FUNCTION IF EXISTS "sp_view_languages_by_user";;
CREATE FUNCTION "sp_view_languages_by_user" (IN "p_user_id" text) RETURNS language LANGUAGE sql AS '
    SELECT l.*
    FROM variamos.language l,
         variamos.user_language ul,
         variamos.user_role ur,
         variamos.role_permission rp,
         variamos.permission p
    WHERE l.id = ul.language_id
      AND ur.role_id = rp.role_id
      AND rp.permission_id = p.id
      AND (
            l."stateAccept" = ''ACTIVE''
            OR (
                l."stateAccept" <> ''ACTIVE''
                AND ur.user_id = p_user_id
                AND (
                    p.id = 2
                    OR (
                        p.id = 1
                        AND ur.user_id = ul.user_id
                    )
                )
            )
          )
       AND l."stateAccept" <> ''DELETED''
    GROUP BY l.id
    ORDER BY l.name;
';

DROP FUNCTION IF EXISTS "sp_view_permissions_by_user";;
CREATE FUNCTION "sp_view_permissions_by_user" (IN "p_user_id" text) RETURNS permission LANGUAGE sql AS '

select p.* 
from variamos.permission p
inner join variamos.role_permission rp on rp.permission_id=p.id
inner join variamos.user_role ur on ur.role_id=rp.role_id
where ur.user_id=p_user_id
group by p.id, p.name

';

DROP TABLE IF EXISTS "bug_attachments";
DROP SEQUENCE IF EXISTS "variamos".bug_attachments_id_seq;
CREATE SEQUENCE "variamos".bug_attachments_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 6 CACHE 1;

CREATE TABLE "variamos"."bug_attachments" (
    "id" integer DEFAULT nextval('bug_attachments_id_seq') NOT NULL,
    "file_path" text NOT NULL,
    "file_type" text NOT NULL,
    "bug_id" uuid NOT NULL,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "bug_attachments_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "bug_notes";
DROP SEQUENCE IF EXISTS "variamos".bug_notes_id_seq;
CREATE SEQUENCE "variamos".bug_notes_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 5 CACHE 1;

CREATE TABLE "variamos"."bug_notes" (
    "id" integer DEFAULT nextval('bug_notes_id_seq') NOT NULL,
    "bug_id" uuid NOT NULL,
    "body" text NOT NULL,
    "author_id" text,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "bug_notes_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "bug_status_logs";
DROP SEQUENCE IF EXISTS "variamos".bug_status_logs_id_seq;
CREATE SEQUENCE "variamos".bug_status_logs_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 5 CACHE 1;

CREATE TABLE "variamos"."bug_status_logs" (
    "id" integer DEFAULT nextval('bug_status_logs_id_seq') NOT NULL,
    "action" text NOT NULL,
    "comment" text,
    "bug_id" uuid NOT NULL,
    "operator_id" text,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "bug_status_logs_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "bugs";
CREATE TABLE "variamos"."bugs" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "priority" enum_bugs_priority DEFAULT 'medium' NOT NULL,
    "category" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "reporter_email" text,
    "created_by_id" text,
    "github_repo" text,
    "git_issue_number" integer,
    "github_creator" text,
    "github_html_url" text,
    "github_assignee" text,
    "github_created_at" timestamptz,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "bugs_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "comment";
DROP SEQUENCE IF EXISTS "variamos".comment_id_seq;
CREATE SEQUENCE "variamos".comment_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 42 CACHE 1;

CREATE TABLE "variamos"."comment" (
    "id" integer DEFAULT nextval('comment_id_seq') NOT NULL,
    "content" character varying NOT NULL,
    "date" date NOT NULL,
    "status" character varying NOT NULL,
    "authorName" character varying NOT NULL,
    "languageReviewId" integer,
    CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "country";
CREATE TABLE "variamos"."country" (
    "code" character varying(2) NOT NULL,
    "name" character varying(64) NOT NULL,
    "latitude" numeric NOT NULL,
    "longitude" numeric NOT NULL,
    "code3" character varying(3),
    CONSTRAINT "country_pkey" PRIMARY KEY ("code")
)
WITH (oids = false);

INSERT INTO "country" ("code", "name", "latitude", "longitude", "code3") VALUES
('AD',	'Andorra',	42.546245,	1.601554,	'AND'),
('AE',	'United Arab Emirates',	23.424076,	53.847818,	'UAE'),
('AF',	'Afghanistan',	33.93911,	67.709953,	'AFG'),
('AG',	'Antigua and Barbuda',	17.060816,	-61.796428,	'ATG'),
('AI',	'Anguilla',	18.220554,	-63.068615,	'AIA'),
('AL',	'Albania',	41.153332,	20.168331,	'ALB'),
('AM',	'Armenia',	40.069099,	45.038189,	'ARM'),
('AN',	'Netherlands Antilles',	12.226079,	-69.060087,	'ANT'),
('AO',	'Angola',	-11.202692,	17.873887,	'AGO'),
('AQ',	'Antarctica',	-75.250973,	-0.071389,	'ATA'),
('AR',	'Argentina',	-38.416097,	-63.616672,	'ARG'),
('AS',	'American Samoa',	-14.270972,	-170.132217,	'ASM'),
('AT',	'Austria',	47.516231,	14.550072,	'AUT'),
('AU',	'Australia',	-25.274398,	133.775136,	'AUS'),
('AW',	'Aruba',	12.52111,	-69.968338,	'ABW'),
('AZ',	'Azerbaijan',	40.143105,	47.576927,	'AZE'),
('BA',	'Bosnia and Herzegovina',	43.915886,	17.679076,	'BIH'),
('BB',	'Barbados',	13.193887,	-59.543198,	'BRB'),
('BD',	'Bangladesh',	23.684994,	90.356331,	'BGD'),
('BE',	'Belgium',	50.503887,	4.469936,	'BEL'),
('BF',	'Burkina Faso',	12.238333,	-1.561593,	'BFA'),
('BG',	'Bulgaria',	42.733883,	25.48583,	'BGR'),
('BH',	'Bahrain',	25.930414,	50.637772,	'BHR'),
('BI',	'Burundi',	-3.373056,	29.918886,	'BDI'),
('BJ',	'Benin',	9.30769,	2.315834,	'BEN'),
('BM',	'Bermuda',	32.321384,	-64.75737,	'BMU'),
('BN',	'Brunei',	4.535277,	114.727669,	'BRN'),
('BO',	'Bolivia',	-16.290154,	-63.588653,	'BOL'),
('BR',	'Brazil',	-14.235004,	-51.92528,	'BRA'),
('BS',	'Bahamas',	25.03428,	-77.39628,	'BHS'),
('BT',	'Bhutan',	27.514162,	90.433601,	'BTN'),
('BV',	'Bouvet Island',	-54.423199,	3.413194,	'BVT'),
('BW',	'Botswana',	-22.328474,	24.684866,	'BWA'),
('BY',	'Belarus',	53.709807,	27.953389,	'BLR'),
('BZ',	'Belize',	17.189877,	-88.49765,	'BLZ'),
('CA',	'Canada',	56.130366,	-106.346771,	'CAN'),
('CC',	'Cocos [Keeling] Islands',	-12.164165,	96.870956,	'CCK'),
('CD',	'Congo [DRC]',	-4.038333,	21.758664,	'COD'),
('CF',	'Central African Republic',	6.611111,	20.939444,	'CAF'),
('CG',	'Congo [Republic]',	-0.228021,	15.827659,	'COG'),
('CH',	'Switzerland',	46.818188,	8.227512,	'CHE'),
('CI',	'Côte d''Ivoire',	7.539989,	-5.54708,	'CIV'),
('CL',	'Chile',	-35.675147,	-71.542969,	'CHL'),
('CM',	'Cameroon',	7.369722,	12.354722,	'CMR'),
('CN',	'China',	35.86166,	104.195397,	'CHN'),
('CO',	'Colombia',	4.570868,	-74.297333,	'COL'),
('CR',	'Costa Rica',	9.748917,	-83.753428,	'CRI'),
('CU',	'Cuba',	21.521757,	-77.781167,	'CUB'),
('CV',	'Cape Verde',	16.002082,	-24.013197,	'CPV'),
('CX',	'Christmas Island',	-10.447525,	105.690449,	'CXR'),
('CY',	'Cyprus',	35.126413,	33.429859,	'CYP'),
('CZ',	'Czech Republic',	49.817492,	15.472962,	'CZE'),
('DE',	'Germany',	51.165691,	10.451526,	'DEU'),
('DJ',	'Djibouti',	11.825138,	42.590275,	'DJI'),
('DK',	'Denmark',	56.26392,	9.501785,	'DNK'),
('DM',	'Dominica',	15.414999,	-61.370976,	'DMA'),
('DO',	'Dominican Republic',	18.735693,	-70.162651,	'DOM'),
('DZ',	'Algeria',	28.033886,	1.659626,	'DZA'),
('EC',	'Ecuador',	-1.831239,	-78.183406,	'ECU'),
('EE',	'Estonia',	58.595272,	25.013607,	'EST'),
('EG',	'Egypt',	26.820553,	30.802498,	'EGY'),
('EH',	'Western Sahara',	24.215527,	-12.885834,	'ESH'),
('ER',	'Eritrea',	15.179384,	39.782334,	'ERI'),
('ES',	'Spain',	40.463667,	-3.74922,	'ESP'),
('ET',	'Ethiopia',	9.145,	40.489673,	'ETH'),
('FI',	'Finland',	61.92411,	25.748151,	'FIN'),
('FJ',	'Fiji',	-16.578193,	179.414413,	'FJI'),
('FK',	'Falkland Islands [Islas Malvinas]',	-51.796253,	-59.523613,	'FLK'),
('FM',	'Micronesia',	7.425554,	150.550812,	'FSM'),
('FO',	'Faroe Islands',	61.892635,	-6.911806,	'FRO'),
('FR',	'France',	46.227638,	2.213749,	'FRA'),
('GA',	'Gabon',	-0.803689,	11.609444,	'GAB'),
('GB',	'United Kingdom',	55.378051,	-3.435973,	'GBR'),
('GD',	'Grenada',	12.262776,	-61.604171,	'GRD'),
('GE',	'Georgia',	42.315407,	43.356892,	'GEO'),
('GF',	'French Guiana',	3.933889,	-53.125782,	'GUF'),
('GG',	'Guernsey',	49.465691,	-2.585278,	'GGY'),
('GH',	'Ghana',	7.946527,	-1.023194,	'GHA'),
('GI',	'Gibraltar',	36.137741,	-5.345374,	'GIB'),
('GL',	'Greenland',	71.706936,	-42.604303,	'GRL'),
('GM',	'Gambia',	13.443182,	-15.310139,	'GMB'),
('GN',	'Guinea',	9.945587,	-9.696645,	'GIN'),
('GP',	'Guadeloupe',	16.995971,	-62.067641,	'GLP'),
('GQ',	'Equatorial Guinea',	1.650801,	10.267895,	'EQG'),
('GR',	'Greece',	39.074208,	21.824312,	'GRC'),
('GS',	'South Georgia and the South Sandwich Islands',	-54.429579,	-36.587909,	'SGS'),
('GT',	'Guatemala',	15.783471,	-90.230759,	'GTM'),
('GU',	'Guam',	13.444304,	144.793731,	'GUM'),
('GW',	'Guinea-Bissau',	11.803749,	-15.180413,	'GNB'),
('GY',	'Guyana',	4.860416,	-58.93018,	'GUY'),
('GZ',	'Gaza Strip',	31.354676,	34.308825,	'GZA'),
('HK',	'Hong Kong',	22.396428,	114.109497,	'HKG'),
('HM',	'Heard Island and McDonald Islands',	-53.08181,	73.504158,	'HMD'),
('HN',	'Honduras',	15.199999,	-86.241905,	'HND'),
('HR',	'Croatia',	45.1,	15.2,	'HRV'),
('HT',	'Haiti',	18.971187,	-72.285215,	'HTI'),
('HU',	'Hungary',	47.162494,	19.503304,	'HUN'),
('ID',	'Indonesia',	-0.789275,	113.921327,	'IDN'),
('IE',	'Ireland',	53.41291,	-8.24389,	'IRL'),
('IL',	'Israel',	31.046051,	34.851612,	'ISR'),
('IM',	'Isle of Man',	54.236107,	-4.548056,	'IMN'),
('IN',	'India',	20.593684,	78.96288,	'IND'),
('IO',	'British Indian Ocean Territory',	-6.343194,	71.876519,	'IOT'),
('IQ',	'Iraq',	33.223191,	43.679291,	'IRQ'),
('IR',	'Iran',	32.427908,	53.688046,	'IRN'),
('IS',	'Iceland',	64.963051,	-19.020835,	'ISL'),
('IT',	'Italy',	41.87194,	12.56738,	'ITA'),
('JE',	'Jersey',	49.214439,	-2.13125,	'JEY'),
('JM',	'Jamaica',	18.109581,	-77.297508,	'JAM'),
('JO',	'Jordan',	30.585164,	36.238414,	'JOR'),
('JP',	'Japan',	36.204824,	138.252924,	'JPN'),
('KE',	'Kenya',	-0.023559,	37.906193,	'KEN'),
('KG',	'Kyrgyzstan',	41.20438,	74.766098,	'KGZ'),
('KH',	'Cambodia',	12.565679,	104.990963,	'KHM'),
('KI',	'Kiribati',	-3.370417,	-168.734039,	'KIR'),
('KM',	'Comoros',	-11.875001,	43.872219,	'COM'),
('KN',	'Saint Kitts and Nevis',	17.357822,	-62.782998,	'KNA'),
('KP',	'North Korea',	40.339852,	127.510093,	'PRK'),
('KR',	'South Korea',	35.907757,	127.766922,	'KOR'),
('KW',	'Kuwait',	29.31166,	47.481766,	'KWT'),
('KY',	'Cayman Islands',	19.513469,	-80.566956,	'CYM'),
('KZ',	'Kazakhstan',	48.019573,	66.923684,	'KAZ'),
('LA',	'Laos',	19.85627,	102.495496,	'LAO'),
('LB',	'Lebanon',	33.854721,	35.862285,	'LBN'),
('LC',	'Saint Lucia',	13.909444,	-60.978893,	'LCA'),
('LI',	'Liechtenstein',	47.166,	9.555373,	'LIE'),
('LK',	'Sri Lanka',	7.873054,	80.771797,	'LKA'),
('LR',	'Liberia',	6.428055,	-9.429499,	'LBR'),
('LS',	'Lesotho',	-29.609988,	28.233608,	'LSO'),
('LT',	'Lithuania',	55.169438,	23.881275,	'LTU'),
('LU',	'Luxembourg',	49.815273,	6.129583,	'LUX'),
('LV',	'Latvia',	56.879635,	24.603189,	'LVA'),
('LY',	'Libya',	26.3351,	17.228331,	'LBY'),
('MA',	'Morocco',	31.791702,	-7.09262,	'MAR'),
('MC',	'Monaco',	43.750298,	7.412841,	'MCO'),
('MD',	'Moldova',	47.411631,	28.369885,	'MDA'),
('ME',	'Montenegro',	42.708678,	19.37439,	'MNE'),
('MG',	'Madagascar',	-18.766947,	46.869107,	'MDG'),
('MH',	'Marshall Islands',	7.131474,	171.184478,	'MHL'),
('MK',	'Macedonia [FYROM]',	41.608635,	21.745275,	'MKD'),
('ML',	'Mali',	17.570692,	-3.996166,	'MLI'),
('MM',	'Myanmar [Burma]',	21.913965,	95.956223,	'MMR'),
('MN',	'Mongolia',	46.862496,	103.846656,	'MNG'),
('MO',	'Macau',	22.198745,	113.543873,	'MAC'),
('MP',	'Northern Mariana Islands',	17.33083,	145.38469,	'MNP'),
('MQ',	'Martinique',	14.641528,	-61.024174,	'MTQ'),
('MR',	'Mauritania',	21.00789,	-10.940835,	'MRT'),
('MS',	'Montserrat',	16.742498,	-62.187366,	'MSR'),
('MT',	'Malta',	35.937496,	14.375416,	'MLT'),
('MU',	'Mauritius',	-20.348404,	57.552152,	'MUS'),
('MV',	'Maldives',	3.202778,	73.22068,	'MDV'),
('MW',	'Malawi',	-13.254308,	34.301525,	'MWI'),
('MX',	'Mexico',	23.634501,	-102.552784,	'MEX'),
('MY',	'Malaysia',	4.210484,	101.975766,	'MYS'),
('MZ',	'Mozambique',	-18.665695,	35.529562,	'MOZ'),
('NA',	'Namibia',	-22.95764,	18.49041,	'NAM'),
('NC',	'New Caledonia',	-20.904305,	165.618042,	'NCL'),
('NE',	'Niger',	17.607789,	8.081666,	'NER'),
('NF',	'Norfolk Island',	-29.040835,	167.954712,	'NFK'),
('NG',	'Nigeria',	9.081999,	8.675277,	'NGA'),
('NI',	'Nicaragua',	12.865416,	-85.207229,	'NIC'),
('NL',	'Netherlands',	52.132633,	5.291266,	'NLD'),
('NO',	'Norway',	60.472024,	8.468946,	'NOR'),
('NP',	'Nepal',	28.394857,	84.124008,	'NPL'),
('NR',	'Nauru',	-0.522778,	166.931503,	'NRU'),
('NU',	'Niue',	-19.054445,	-169.867233,	'NIU'),
('NZ',	'New Zealand',	-40.900557,	174.885971,	'NZL'),
('OM',	'Oman',	21.512583,	55.923255,	'OMN'),
('PA',	'Panama',	8.537981,	-80.782127,	'PAN'),
('PE',	'Peru',	-9.189967,	-75.015152,	'PER'),
('PF',	'French Polynesia',	-17.679742,	-149.406843,	'PYF'),
('PG',	'Papua New Guinea',	-6.314993,	143.95555,	'PNG'),
('PH',	'Philippines',	12.879721,	121.774017,	'PHL'),
('PK',	'Pakistan',	30.375321,	69.345116,	'PAK'),
('PL',	'Poland',	51.919438,	19.145136,	'POL'),
('PM',	'Saint Pierre and Miquelon',	46.941936,	-56.27111,	'SPM'),
('PN',	'Pitcairn Islands',	-24.703615,	-127.439308,	'PCN'),
('PR',	'Puerto Rico',	18.220833,	-66.590149,	'PRI'),
('PS',	'Palestinian Territories',	31.952162,	35.233154,	'PSE'),
('PT',	'Portugal',	39.399872,	-8.224454,	'PRT'),
('PW',	'Palau',	7.51498,	134.58252,	'PLW'),
('PY',	'Paraguay',	-23.442503,	-58.443832,	'PRY'),
('QA',	'Qatar',	25.354826,	51.183884,	'QAT'),
('RE',	'Réunion',	-21.115141,	55.536384,	'REU'),
('RO',	'Romania',	45.943161,	24.96676,	'ROU'),
('RS',	'Serbia',	44.016521,	21.005859,	'SRB'),
('RU',	'Russia',	61.52401,	105.318756,	'RUS'),
('RW',	'Rwanda',	-1.940278,	29.873888,	'RWA'),
('SA',	'Saudi Arabia',	23.885942,	45.079162,	'SAU'),
('SB',	'Solomon Islands',	-9.64571,	160.156194,	'SLB'),
('SC',	'Seychelles',	-4.679574,	55.491977,	'SYC'),
('SD',	'Sudan',	12.862807,	30.217636,	'SDN'),
('SE',	'Sweden',	60.128161,	18.643501,	'SWE'),
('SG',	'Singapore',	1.352083,	103.819836,	'SGP'),
('SH',	'Saint Helena',	-24.143474,	-10.030696,	'SHN'),
('SI',	'Slovenia',	46.151241,	14.995463,	'SVN'),
('SJ',	'Svalbard and Jan Mayen',	77.553604,	23.670272,	'SJM'),
('SK',	'Slovakia',	48.669026,	19.699024,	'SVK'),
('SL',	'Sierra Leone',	8.460555,	-11.779889,	'SLE'),
('SM',	'San Marino',	43.94236,	12.457777,	'SMR'),
('SN',	'Senegal',	14.497401,	-14.452362,	'SEN'),
('SO',	'Somalia',	5.152149,	46.199616,	'SOM'),
('SR',	'Suriname',	3.919305,	-56.027783,	'SUR'),
('ST',	'São Tomé and Príncipe',	0.18636,	6.613081,	'STP'),
('SV',	'El Salvador',	13.794185,	-88.89653,	'SLV'),
('SY',	'Syria',	34.802075,	38.996815,	'SYR'),
('SZ',	'Swaziland',	-26.522503,	31.465866,	'SWZ'),
('TC',	'Turks and Caicos Islands',	21.694025,	-71.797928,	'TCI'),
('TD',	'Chad',	15.454166,	18.732207,	'TCD'),
('TF',	'French Southern Territories',	-49.280366,	69.348557,	'ATF'),
('TG',	'Togo',	8.619543,	0.824782,	'TGO'),
('TH',	'Thailand',	15.870032,	100.992541,	'THA'),
('TJ',	'Tajikistan',	38.861034,	71.276093,	'TJK'),
('TK',	'Tokelau',	-8.967363,	-171.855881,	'TKL'),
('TL',	'Timor-Leste',	-8.874217,	125.727539,	'TLS'),
('TM',	'Turkmenistan',	38.969719,	59.556278,	'TKM'),
('TN',	'Tunisia',	33.886917,	9.537499,	'TUN'),
('TO',	'Tonga',	-21.178986,	-175.198242,	'TON'),
('TR',	'Turkey',	38.963745,	35.243322,	'TUR'),
('TT',	'Trinidad and Tobago',	10.691803,	-61.222503,	'TTO'),
('TV',	'Tuvalu',	-7.109535,	177.64933,	'TVL'),
('TW',	'Taiwan',	23.69781,	120.960515,	'TWN'),
('TZ',	'Tanzania',	-6.369028,	34.888822,	'TZA'),
('UA',	'Ukraine',	48.379433,	31.16558,	'UKR'),
('UG',	'Uganda',	1.373333,	32.290275,	'UGA'),
('US',	'United States',	37.09024,	-95.712891,	'USA'),
('UY',	'Uruguay',	-32.522779,	-55.765835,	'URY'),
('UZ',	'Uzbekistan',	41.377491,	64.585262,	'UZB'),
('VA',	'Vatican City',	41.902916,	12.453389,	'VAT'),
('VC',	'Saint Vincent and the Grenadines',	12.984305,	-61.287228,	'VCT'),
('VE',	'Venezuela',	6.42375,	-66.58973,	'VEN'),
('VG',	'British Virgin Islands',	18.420695,	-64.639968,	'VGB'),
('VI',	'U.S. Virgin Islands',	18.335765,	-64.896335,	'VIR'),
('VN',	'Vietnam',	14.058324,	108.277199,	'VNM'),
('VU',	'Vanuatu',	-15.376706,	166.959158,	'VUT'),
('WF',	'Wallis and Futuna',	-13.768752,	-177.156097,	'WLF'),
('WS',	'Samoa',	-13.759029,	-172.104629,	'WSM'),
('XK',	'Kosovo',	42.602636,	20.902977,	'XKX'),
('YE',	'Yemen',	15.552727,	48.516388,	'YEM'),
('YT',	'Mayotte',	-12.8275,	45.166244,	'MYT'),
('ZA',	'South Africa',	-30.559482,	22.937506,	'ZAF'),
('ZM',	'Zambia',	-13.133897,	27.849332,	'ZMB'),
('ZW',	'Zimbabwe',	-19.015438,	29.154857,	'ZWE');

DROP TABLE IF EXISTS "external_function";
DROP SEQUENCE IF EXISTS "variamos".external_function_id_seq;
CREATE SEQUENCE "variamos".external_function_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 31 CACHE 1;

CREATE TABLE "variamos"."external_function" (
    "id" integer DEFAULT nextval('external_function_id_seq') NOT NULL,
    "name" text,
    "label" text,
    "url" text,
    "header" jsonb,
    "resulting_action" text,
    "language_id" integer,
    "visible" boolean DEFAULT true,
    "call_on_properties_changed" boolean DEFAULT false,
    CONSTRAINT "external_function_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "language";
DROP SEQUENCE IF EXISTS "variamos"."languageRegistry_id_seq";
CREATE SEQUENCE "variamos"."languageRegistry_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 440 CACHE 1;

CREATE TABLE "variamos"."language" (
    "id" integer DEFAULT nextval('"languageRegistry_id_seq"') NOT NULL,
    "name" text,
    "abstractSyntax" jsonb,
    "concreteSyntax" jsonb,
    "type" text,
    "stateAccept" text,
    "semantics" jsonb DEFAULT '{}',
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "languageRegistry_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX unique_language_name ON variamos.language USING btree (name);


DROP TABLE IF EXISTS "language_review";
DROP SEQUENCE IF EXISTS "variamos".language_review_id_seq;
CREATE SEQUENCE "variamos".language_review_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 11 CACHE 1;

CREATE TABLE "variamos"."language_review" (
    "id" integer DEFAULT nextval('language_review_id_seq') NOT NULL,
    "languageId" integer NOT NULL,
    "status" character varying NOT NULL,
    "languageOwner" character varying NOT NULL,
    "languageOwnerEmail" character varying NOT NULL,
    CONSTRAINT "PK_8e272e5756184175c5e4eb7ff89" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "model";
CREATE TABLE "variamos"."model" (
    "id" text NOT NULL,
    "project_id" text NOT NULL,
    "product_line_id" text NOT NULL,
    "engineering_type" text NOT NULL,
    "name" text,
    "type" text,
    "description" text,
    "author" text,
    "source" text,
    "language_id" integer NOT NULL,
    "model" jsonb NOT NULL,
    CONSTRAINT "model_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX idx_model_engineering_type ON variamos.model USING btree (engineering_type);

CREATE INDEX idx_model_language_id ON variamos.model USING btree (language_id);

CREATE INDEX idx_model_project_id ON variamos.model USING btree (project_id);


DROP TABLE IF EXISTS "model_configuration";
CREATE TABLE "variamos"."model_configuration" (
    "id" text NOT NULL,
    "model_id" text NOT NULL,
    "name" text NOT NULL,
    "configuration" jsonb NOT NULL,
    CONSTRAINT "model_configuration_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX idx_model_config_model_id ON variamos.model_configuration USING btree (model_id);


DROP TABLE IF EXISTS "page_visit";
CREATE TABLE "variamos"."page_visit" (
    "page_id" character varying(48) NOT NULL,
    "organization" character varying(128) DEFAULT 'NO_DATA',
    "user_id" text NOT NULL,
    "visit_date" date DEFAULT CURRENT_DATE NOT NULL,
    "country_code" character varying(2)
)
WITH (oids = false);

CREATE INDEX page_visit_idx ON variamos.page_visit USING btree (page_id, country_code, visit_date) WITH (deduplicate_items='true');


DROP TABLE IF EXISTS "password_reset_tokens";
CREATE TABLE "variamos"."password_reset_tokens" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "token_hash" character varying(64) NOT NULL,
    "expires_at" timestamp NOT NULL,
    "used_at" timestamp,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX password_reset_tokens_token_hash_key ON variamos.password_reset_tokens USING btree (token_hash);

CREATE INDEX idx_password_reset_tokens_hash ON variamos.password_reset_tokens USING btree (token_hash);


DROP TABLE IF EXISTS "permission";
DROP SEQUENCE IF EXISTS "variamos".permission_id_seq;
CREATE SEQUENCE "variamos".permission_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 45 CACHE 1;

CREATE TABLE "variamos"."permission" (
    "id" integer DEFAULT nextval('permission_id_seq') NOT NULL,
    "name" text NOT NULL,
    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "project";
CREATE TABLE "variamos"."project" (
    "id" text NOT NULL,
    "project" json,
    "name" character varying DEFAULT 'Project' NOT NULL,
    "template" boolean DEFAULT false NOT NULL,
    "configuration" json,
    "description" text,
    "source" text,
    "author" text,
    "date" timestamptz,
    "type_models" text,
    "owner_id" character varying DEFAULT 'default_owner' NOT NULL,
    "is_collaborative" boolean DEFAULT false,
    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "project_annotation";
CREATE TABLE "variamos"."project_annotation" (
    "id" character varying(255) NOT NULL,
    "project_id" character varying(255) NOT NULL,
    "model_id" character varying(255) NOT NULL,
    "user_id" character varying(255),
    "annotation" jsonb NOT NULL,
    "is_resolved" boolean DEFAULT false,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_annotation_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "project_conflict";
CREATE TABLE "variamos"."project_conflict" (
    "id" character varying NOT NULL,
    "project_id" character varying NOT NULL,
    "model_id" character varying NOT NULL,
    "entity_type" character varying NOT NULL,
    "entity_id" character varying NOT NULL,
    "entity_name" character varying,
    "conflict_type" character varying NOT NULL,
    "status" character varying DEFAULT 'pending' NOT NULL,
    "base_value" jsonb,
    "current_value" jsonb NOT NULL,
    "incoming_value" jsonb NOT NULL,
    "current_operation" jsonb NOT NULL,
    "incoming_operation" jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "resolved_value" jsonb,
    "resolution_type" character varying,
    "resolved_by" character varying,
    "resolved_at" timestamp,
    CONSTRAINT "project_conflict_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX idx_project_conflict_project ON variamos.project_conflict USING btree (project_id);

CREATE INDEX idx_project_conflict_model ON variamos.project_conflict USING btree (model_id);

CREATE INDEX idx_project_conflict_entity ON variamos.project_conflict USING btree (entity_id);

CREATE INDEX idx_project_conflict_status ON variamos.project_conflict USING btree (status);

CREATE INDEX idx_project_conflict_created ON variamos.project_conflict USING btree (created_at DESC);


DROP TABLE IF EXISTS "project_history";
CREATE TABLE "variamos"."project_history" (
    "id" character varying(255) NOT NULL,
    "project_id" character varying(255) NOT NULL,
    "model_id" character varying(255),
    "user_id" character varying(255),
    "action_type" character varying(100) NOT NULL,
    "entity_type" character varying(100) NOT NULL,
    "entity_id" character varying(255),
    "entity_name" text,
    "old_value" jsonb,
    "new_value" jsonb,
    "description" text,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "project_history_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "reviewer";
DROP SEQUENCE IF EXISTS "variamos".reviewer_id_seq;
CREATE SEQUENCE "variamos".reviewer_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 5 CACHE 1;

CREATE TABLE "variamos"."reviewer" (
    "id" integer DEFAULT nextval('reviewer_id_seq') NOT NULL,
    "email" text NOT NULL,
    "languageReviewId" integer,
    CONSTRAINT "PK_677dfc9088091c469b6ee6a9c93" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "role";
CREATE TABLE "variamos"."role" (
    "id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "name" text NOT NULL,
    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "role_permission";
CREATE TABLE "variamos"."role_permission" (
    "role_id" integer NOT NULL,
    "permission_id" integer NOT NULL,
    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id", "permission_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "user";
CREATE TABLE "variamos"."user" (
    "id" text NOT NULL,
    "user" text NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "country_code" character varying(10),
    "is_enabled" boolean DEFAULT true NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "last_login" timestamptz,
    "password" character varying(255),
    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


-- DELIMITER ;;

CREATE TRIGGER "after_insert_user" AFTER INSERT ON "variamos"."user" FOR EACH ROW EXECUTE FUNCTION insert_user_role();

-- DELIMITER ;

DROP TABLE IF EXISTS "user_language";
CREATE TABLE "variamos"."user_language" (
    "user_id" text NOT NULL,
    "language_id" integer NOT NULL,
    "access_level" character varying(10) DEFAULT 'OWNER' NOT NULL,
    CONSTRAINT "user_language_pkey" PRIMARY KEY ("user_id", "language_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "user_project";
CREATE TABLE "variamos"."user_project" (
    "user_id" text NOT NULL,
    "project_id" text NOT NULL,
    "role" character varying(255) DEFAULT '',
    CONSTRAINT "user_project_pkey" PRIMARY KEY ("user_id", "project_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "user_role";
CREATE TABLE "variamos"."user_role" (
    "user_id" text NOT NULL,
    "role_id" integer NOT NULL,
    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id", "role_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "user_visit";
CREATE TABLE "variamos"."user_visit" (
    "user_id" text NOT NULL,
    "country_code" character varying(2),
    "visit_date" date NOT NULL,
    CONSTRAINT "user_visit_pkey" PRIMARY KEY ("user_id", "visit_date")
)
WITH (oids = false);


DROP VIEW IF EXISTS "view_users_languages";
CREATE TABLE "view_users_languages" ("id" text, "name" text, "email" text, "language_id" integer, "language" text);


DROP VIEW IF EXISTS "view_users_roles";
CREATE TABLE "view_users_roles" ("id" text, "name" text, "email" text, "role_id" integer, "role" text);


DROP TABLE IF EXISTS "visits_summary";
CREATE TABLE "variamos"."visits_summary" (
    "page_id" text NOT NULL,
    "unique_visits" bigint DEFAULT '0' NOT NULL,
    "visits" bigint DEFAULT '0' NOT NULL,
    "visits_date" date NOT NULL,
    CONSTRAINT "visits_summary_pkey" PRIMARY KEY ("page_id", "visits_date")
)
WITH (oids = false);


DROP TABLE IF EXISTS "yearly_visits_summary";
CREATE TABLE "variamos"."yearly_visits_summary" (
    "count" bigint NOT NULL,
    "visit_year" date NOT NULL,
    "country_code" character varying(2),
    CONSTRAINT "yearly_visits_summary_pkey" PRIMARY KEY ("count", "visit_year")
)
WITH (oids = false);

CREATE INDEX yearly_visits_summary_idx ON variamos.yearly_visits_summary USING btree (country_code, visit_year DESC) WITH (deduplicate_items='true');


ALTER TABLE ONLY "variamos"."bug_attachments" ADD CONSTRAINT "fk_bug_attachments_bug" FOREIGN KEY (bug_id) REFERENCES bugs(id) ON DELETE CASCADE;

ALTER TABLE ONLY "variamos"."bug_notes" ADD CONSTRAINT "fk_bug_notes_author" FOREIGN KEY (author_id) REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE ONLY "variamos"."bug_notes" ADD CONSTRAINT "fk_bug_notes_bug" FOREIGN KEY (bug_id) REFERENCES bugs(id) ON DELETE CASCADE;

ALTER TABLE ONLY "variamos"."bug_status_logs" ADD CONSTRAINT "fk_bug_status_logs_bug" FOREIGN KEY (bug_id) REFERENCES bugs(id) ON DELETE CASCADE;
ALTER TABLE ONLY "variamos"."bug_status_logs" ADD CONSTRAINT "fk_bug_status_logs_operator" FOREIGN KEY (operator_id) REFERENCES "user"(id) ON DELETE SET NULL;

ALTER TABLE ONLY "variamos"."comment" ADD CONSTRAINT "FK_09e2bf9083b8d7320a8fd5742a8" FOREIGN KEY ("languageReviewId") REFERENCES language_review(id);

ALTER TABLE ONLY "variamos"."model" ADD CONSTRAINT "model_language_id_fkey" FOREIGN KEY (language_id) REFERENCES language(id);
ALTER TABLE ONLY "variamos"."model" ADD CONSTRAINT "model_project_id_fkey" FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE;

ALTER TABLE ONLY "variamos"."model_configuration" ADD CONSTRAINT "model_configuration_model_id_fkey" FOREIGN KEY (model_id) REFERENCES model(id) ON DELETE CASCADE;

ALTER TABLE ONLY "variamos"."page_visit" ADD CONSTRAINT "page_visit_country_fk" FOREIGN KEY (country_code) REFERENCES country(code);

ALTER TABLE ONLY "variamos"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY "variamos"."project" ADD CONSTRAINT "fk_project_owner_id_user" FOREIGN KEY (owner_id) REFERENCES "user"(id);

ALTER TABLE ONLY "variamos"."project_annotation" ADD CONSTRAINT "fk_project_annotation_project" FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE;
ALTER TABLE ONLY "variamos"."project_annotation" ADD CONSTRAINT "fk_project_annotation_user" FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE SET NULL;

ALTER TABLE ONLY "variamos"."project_conflict" ADD CONSTRAINT "project_conflict_project_id_fkey" FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE;
ALTER TABLE ONLY "variamos"."project_conflict" ADD CONSTRAINT "project_conflict_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES "user"(id);

ALTER TABLE ONLY "variamos"."project_history" ADD CONSTRAINT "fk_project_history_project" FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE;
ALTER TABLE ONLY "variamos"."project_history" ADD CONSTRAINT "fk_project_history_user" FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE SET NULL;

ALTER TABLE ONLY "variamos"."reviewer" ADD CONSTRAINT "FK_60b21ea0d240eaafe5a7f2ce433" FOREIGN KEY ("languageReviewId") REFERENCES language_review(id);

ALTER TABLE ONLY "variamos"."role_permission" ADD CONSTRAINT "permission_fkey" FOREIGN KEY (permission_id) REFERENCES permission(id);
ALTER TABLE ONLY "variamos"."role_permission" ADD CONSTRAINT "role_fkey" FOREIGN KEY (role_id) REFERENCES role(id);

ALTER TABLE ONLY "variamos"."user_language" ADD CONSTRAINT "user_language_language_id_fkey" FOREIGN KEY (language_id) REFERENCES language(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;
ALTER TABLE ONLY "variamos"."user_language" ADD CONSTRAINT "user_language_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

ALTER TABLE ONLY "variamos"."user_project" ADD CONSTRAINT "user_project_project_id_fkey" FOREIGN KEY (project_id) REFERENCES project(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "variamos"."user_project" ADD CONSTRAINT "user_project_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(id);

ALTER TABLE ONLY "variamos"."user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY (role_id) REFERENCES role(id);
ALTER TABLE ONLY "variamos"."user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(id);

DROP TABLE IF EXISTS "view_users_languages";
CREATE VIEW "variamos"."view_users_languages" AS SELECT u.id,
    u.name,
    u.email,
    ur.language_id,
    r.name AS language
   FROM (("user" u
     LEFT JOIN user_language ur ON ((ur.user_id = u.id)))
     LEFT JOIN language r ON ((r.id = ur.language_id)))
  ORDER BY u.name, r.name;

DROP TABLE IF EXISTS "view_users_roles";
CREATE VIEW "variamos"."view_users_roles" AS SELECT u.id,
    u.name,
    u.email,
    ur.role_id,
    r.name AS role
   FROM (("user" u
     LEFT JOIN user_role ur ON ((ur.user_id = u.id)))
     LEFT JOIN role r ON ((r.id = ur.role_id)))
  ORDER BY u.name, r.name;

-- 2026-07-22 19:13:49 UTC

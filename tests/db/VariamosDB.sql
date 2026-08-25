--
-- PostgreSQL database dump
--

-- Dumped from database version 14.8 (Debian 14.8-1.pgdg120+1)
-- Dumped by pg_dump version 14.8 (Debian 14.8-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: variamos; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA variamos;


--
-- Name: enum_bugs_priority; Type: TYPE; Schema: variamos; Owner: -
--

CREATE TYPE variamos.enum_bugs_priority AS ENUM (
    'low',
    'medium',
    'high'
);


--
-- Name: get_daily_unique_visits_metrics(date, date); Type: FUNCTION; Schema: variamos; Owner: -
--

CREATE FUNCTION variamos.get_daily_unique_visits_metrics(startdate date, enddate date) RETURNS TABLE(char_data json)
    LANGUAGE plpgsql
    AS $$
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
		'id', id,
		'title', title,
		'chartType', chart_type,
		'defaultFilter', default_filter,
		'labelKey', label_key,
		'filters', filters,
		'data', data
	)
	FROM (
		SELECT
		'daily_unique_visits' AS id,
		'Daily Unique Visits' AS title,
		'line' AS chart_type,
		'date' as label_key,
		'page' AS default_filter,
		'["page"]'::json AS filters,
		(
			SELECT json_agg(json_build_object('page', page_id, 'count', unique_visits, 'date', visits_date))
			FROM daily_visits
		) AS data
	) AS chart_data;

END;
$$;


--
-- Name: get_daily_visits_metrics(date, date); Type: FUNCTION; Schema: variamos; Owner: -
--

CREATE FUNCTION variamos.get_daily_visits_metrics(startdate date, enddate date) RETURNS TABLE(char_data json)
    LANGUAGE plpgsql
    AS $$
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
        'id', id,
		'title', title,
		'chartType', chart_type,
		'defaultFilter', default_filter,
		'labelKey', label_key,
		'filters', filters,
		'data', data
	)
	FROM (
		SELECT 
        'daily_visits' AS id,
		'Daily Visits' AS title,
		'line' AS chart_type,
		'date' as label_key,
		'page' AS default_filter,
		'["page"]'::json AS filters,
		(
			SELECT json_agg(json_build_object('page', page_id, 'count', visits, 'date', visits_date))
			FROM daily_visits
		) AS data
	) AS chart_data;

END;
$$;


--
-- Name: get_metrics(); Type: FUNCTION; Schema: variamos; Owner: -
--

CREATE FUNCTION variamos.get_metrics() RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    metrics_data JSON;
    dailyStartDate DATE := current_date - INTERVAL '3 months';
    dailyEndDate DATE := current_date;
    monthlyStartDate DATE := current_date - INTERVAL '24 months';
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
$$;


--
-- Name: get_monthly_visits_metrics(date, date); Type: FUNCTION; Schema: variamos; Owner: -
--

CREATE FUNCTION variamos.get_monthly_visits_metrics(startdate date, enddate date) RETURNS TABLE(char_data json)
    LANGUAGE plpgsql
    AS $$
DECLARE
BEGIN
    RETURN QUERY WITH
   	monthly_visits AS (
        SELECT
            page_id,
            TO_CHAR(visits_date, 'YYYY-MM') AS month,	
            SUM(visits) AS total_visits
        FROM variamos.visits_summary
		WHERE visits_date BETWEEN startDate AND endDate
        GROUP BY page_id, month
        ORDER BY page_id, month
    )
    SELECT json_build_object(
		'id', id,
		'title', title,
		'chartType', chart_type,
		'defaultFilter', default_filter,
		'labelKey', label_key,
		'filters', filters,
		'data', data
	)
	FROM (
		SELECT 
		'monthly_visits' AS id,
		'Monthly Visits' AS title,
		'line' AS chart_type,
		'date' as label_key,
		'page' AS default_filter,
		'["page"]'::json AS filters,
		(
			SELECT json_agg(json_build_object('page', page_id, 'count', total_visits, 'date', month))
			FROM monthly_visits
		) AS data
	) AS chart_data;

END;
$$;


--
-- Name: get_top_visited_pages_metrics(); Type: FUNCTION; Schema: variamos; Owner: -
--

CREATE FUNCTION variamos.get_top_visited_pages_metrics() RETURNS TABLE(char_data json)
    LANGUAGE plpgsql
    AS $$
DECLARE
BEGIN
    RETURN QUERY WITH
   	top_visited_pages AS (
        SELECT
            page_id,
            SUM(visits) AS total_visits
        FROM variamos.visits_summary
        WHERE visits_date > current_date - INTERVAL '3 months'
        GROUP BY page_id
        ORDER BY total_visits DESC, page_id
		LIMIT 10
    )
    SELECT json_build_object(
		'id', id,
		'title', title,
		'chartType', chart_type,
		'defaultFilter', default_filter,
		'labelKey', label_key,
		'filters', filters,
		'data', data
	)
	FROM (
		SELECT 
		'top_visited_pages' AS id,
		'Top visited pages (Last 3 Months)' AS title,
		'doughnut' AS chart_type,
		'page' as label_key,
		'page' AS default_filter,
		'["page"]'::json AS filters,
		(
			SELECT json_agg(json_build_object('page', page_id, 'count', total_visits))
			FROM top_visited_pages
		) AS data
	) AS chart_data;

END;
$$;


--
-- Name: get_yearly_visits_metrics(); Type: FUNCTION; Schema: variamos; Owner: -
--

CREATE FUNCTION variamos.get_yearly_visits_metrics() RETURNS TABLE(char_data json)
    LANGUAGE plpgsql
    AS $$
DECLARE
BEGIN
    RETURN QUERY WITH
   	yearly_visits  AS (
        SELECT COALESCE(c.name, 'NO COUNTRY') as country_name
			,EXTRACT(YEAR FROM yvs.visit_year)::TEXT as visit_year
			,yvs.count AS visits_count
		FROM variamos.yearly_visits_summary yvs
		LEFT JOIN variamos.country AS c ON (c.code = yvs.country_code)
		WHERE yvs.visit_year = DATE_TRUNC('year', current_date) - INTERVAL '1 years'
		UNION ALL (
			SELECT COALESCE(c.name, 'NO COUNTRY') as country_name
				,EXTRACT(YEAR FROM uv.visit_date)::TEXT as visit_year
				,count(1) as visits_count 
			FROM variamos.user_visit AS uv
			LEFT JOIN variamos.country AS c ON (c.code = uv.country_code)
			GROUP BY c.name, uv.visit_date
			ORDER BY uv.visit_date DESC , c.name ASC
		)
    )
    SELECT json_build_object(
		'id', id,
		'title', title,
		'chartType', chart_type,
		'defaultFilter', default_filter,
		'labelKey', label_key,
		'filters', filters,
		'data', data
	)
	FROM (
		SELECT 
		'yearly_visits' AS id,
		'Yearly visits' AS title,
		'geo' AS chart_type,
		'Country' as label_key,
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
$$;


--
-- Name: insert_user_role(); Type: FUNCTION; Schema: variamos; Owner: -
--

CREATE FUNCTION variamos.insert_user_role() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO variamos.user_role (user_id, role_id) VALUES (NEW.id, 2);
	INSERT INTO variamos.user_role (user_id, role_id) VALUES (NEW.id, 3);
	
    RETURN NEW;
END;
$$;


--
-- Name: sp_add_user_language(character varying, character varying); Type: PROCEDURE; Schema: variamos; Owner: -
--

CREATE PROCEDURE variamos.sp_add_user_language(IN user_name character varying, IN language_name character varying)
    LANGUAGE sql
    AS $$
insert into variamos.user_language(user_id, language_id)
select u.id, l.id
from variamos.user u, variamos.language l
where u.email=user_name
and l.name ilike language_name; 

$$;


--
-- Name: sp_add_user_role(character varying, character varying); Type: PROCEDURE; Schema: variamos; Owner: -
--

CREATE PROCEDURE variamos.sp_add_user_role(IN user_name character varying, IN rol_name character varying)
    LANGUAGE sql
    AS $$
insert into variamos.user_role(user_id, role_id)
select u.id, l.id
from variamos.user u, variamos.role l
where u.email=user_name
and l.name ilike rol_name; 

$$;


--
-- Name: sp_view_languages(text, text); Type: FUNCTION; Schema: variamos; Owner: -
--

CREATE FUNCTION variamos.sp_view_languages(p_type text, p_user_id text) RETURNS TABLE(id integer, name text, type text)
    LANGUAGE sql
    AS $$

SELECT l.id, l.name, l.type
FROM variamos.language l
left join variamos.user_language ul on ul.language_id=l.id
where l.type=p_type
and l."stateAccept"='ACTIVE' or (l."stateAccept"='PENDING' and ul.user_id=p_user_id)
order by l.type, l.name

$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: language; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.language (
    id integer NOT NULL,
    name text,
    "abstractSyntax" jsonb,
    "concreteSyntax" jsonb,
    type text,
    "stateAccept" text,
    semantics jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sp_view_languages_by_user(text); Type: FUNCTION; Schema: variamos; Owner: -
--

CREATE FUNCTION variamos.sp_view_languages_by_user(p_user_id text) RETURNS SETOF variamos.language
    LANGUAGE sql
    AS $$
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
            l."stateAccept" = 'ACTIVE'
            OR (
                l."stateAccept" <> 'ACTIVE'
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
       AND l."stateAccept" <> 'DELETED'
    GROUP BY l.id
    ORDER BY l.name;
$$;


--
-- Name: permission_id_seq; Type: SEQUENCE; Schema: variamos; Owner: -
--

CREATE SEQUENCE variamos.permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: permission; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.permission (
    id integer DEFAULT nextval('variamos.permission_id_seq'::regclass) NOT NULL,
    name text NOT NULL
);


--
-- Name: sp_view_permissions_by_user(text); Type: FUNCTION; Schema: variamos; Owner: -
--

CREATE FUNCTION variamos.sp_view_permissions_by_user(p_user_id text) RETURNS SETOF variamos.permission
    LANGUAGE sql
    AS $$

select p.* 
from variamos.permission p
inner join variamos.role_permission rp on rp.permission_id=p.id
inner join variamos.user_role ur on ur.role_id=rp.role_id
where ur.user_id=p_user_id
group by p.id, p.name

$$;


--
-- Name: bug_attachments_id_seq; Type: SEQUENCE; Schema: variamos; Owner: -
--

CREATE SEQUENCE variamos.bug_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: bug_attachments; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.bug_attachments (
    id integer DEFAULT nextval('variamos.bug_attachments_id_seq'::regclass) NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    bug_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: bug_notes_id_seq; Type: SEQUENCE; Schema: variamos; Owner: -
--

CREATE SEQUENCE variamos.bug_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: bug_notes; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.bug_notes (
    id integer DEFAULT nextval('variamos.bug_notes_id_seq'::regclass) NOT NULL,
    bug_id uuid NOT NULL,
    body text NOT NULL,
    author_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: bug_status_logs_id_seq; Type: SEQUENCE; Schema: variamos; Owner: -
--

CREATE SEQUENCE variamos.bug_status_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: bug_status_logs; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.bug_status_logs (
    id integer DEFAULT nextval('variamos.bug_status_logs_id_seq'::regclass) NOT NULL,
    action text NOT NULL,
    comment text,
    bug_id uuid NOT NULL,
    operator_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: bugs; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.bugs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    priority variamos.enum_bugs_priority DEFAULT 'medium'::variamos.enum_bugs_priority NOT NULL,
    category text,
    status text DEFAULT 'pending'::text NOT NULL,
    reporter_email text,
    created_by_id text,
    github_repo text,
    git_issue_number integer,
    github_creator text,
    github_html_url text,
    github_assignee text,
    github_created_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: comment; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.comment (
    id integer NOT NULL,
    content character varying NOT NULL,
    date date NOT NULL,
    status character varying NOT NULL,
    "authorName" character varying NOT NULL,
    "languageReviewId" integer
);


--
-- Name: comment_id_seq; Type: SEQUENCE; Schema: variamos; Owner: -
--

CREATE SEQUENCE variamos.comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comment_id_seq; Type: SEQUENCE OWNED BY; Schema: variamos; Owner: -
--

ALTER SEQUENCE variamos.comment_id_seq OWNED BY variamos.comment.id;


--
-- Name: country; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.country (
    code character varying(2) NOT NULL,
    name character varying(64) NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    code3 character varying(3)
);


--
-- Name: external_function; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.external_function (
    id integer NOT NULL,
    name text,
    label text,
    url text,
    header jsonb,
    resulting_action text,
    language_id integer,
    visible boolean DEFAULT true,
    call_on_properties_changed boolean DEFAULT false
);


--
-- Name: external_function_id_seq; Type: SEQUENCE; Schema: variamos; Owner: -
--

CREATE SEQUENCE variamos.external_function_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: external_function_id_seq; Type: SEQUENCE OWNED BY; Schema: variamos; Owner: -
--

ALTER SEQUENCE variamos.external_function_id_seq OWNED BY variamos.external_function.id;


--
-- Name: languageRegistry_id_seq; Type: SEQUENCE; Schema: variamos; Owner: -
--

CREATE SEQUENCE variamos."languageRegistry_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: languageRegistry_id_seq; Type: SEQUENCE OWNED BY; Schema: variamos; Owner: -
--

ALTER SEQUENCE variamos."languageRegistry_id_seq" OWNED BY variamos.language.id;


--
-- Name: language_review; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.language_review (
    id integer NOT NULL,
    "languageId" integer NOT NULL,
    status character varying NOT NULL,
    "languageOwner" character varying NOT NULL,
    "languageOwnerEmail" character varying NOT NULL
);


--
-- Name: language_review_id_seq; Type: SEQUENCE; Schema: variamos; Owner: -
--

CREATE SEQUENCE variamos.language_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: language_review_id_seq; Type: SEQUENCE OWNED BY; Schema: variamos; Owner: -
--

ALTER SEQUENCE variamos.language_review_id_seq OWNED BY variamos.language_review.id;


--
-- Name: model; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.model (
    id text NOT NULL,
    project_id text NOT NULL,
    product_line_id text NOT NULL,
    engineering_type text NOT NULL,
    name text,
    type text,
    description text,
    author text,
    source text,
    language_id integer NOT NULL,
    model jsonb NOT NULL,
    is_deleted boolean DEFAULT false,
    model_level character varying DEFAULT 'domain'::character varying,
    is_public boolean DEFAULT true
);


--
-- Name: model_configuration; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.model_configuration (
    id text NOT NULL,
    model_id text NOT NULL,
    name text NOT NULL,
    configuration jsonb NOT NULL
);


--
-- Name: page_visit; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.page_visit (
    page_id character varying(48) NOT NULL,
    organization character varying(128) DEFAULT 'NO_DATA'::character varying,
    user_id text NOT NULL,
    visit_date date DEFAULT CURRENT_DATE NOT NULL,
    country_code character varying(2)
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: project; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.project (
    id text NOT NULL,
    project json NOT NULL,
    name character varying DEFAULT 'Project'::character varying NOT NULL,
    template boolean DEFAULT false NOT NULL,
    configuration json,
    description text,
    source text,
    author text,
    date timestamp with time zone,
    type_models text,
    owner_id character varying DEFAULT 'default_owner'::character varying NOT NULL,
    is_collaborative boolean DEFAULT false,
    is_deleted boolean DEFAULT false
);


--
-- Name: project_annotation; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.project_annotation (
    id character varying(255) NOT NULL,
    project_id character varying(255) NOT NULL,
    model_id character varying(255) NOT NULL,
    user_id character varying(255),
    annotation jsonb NOT NULL,
    is_resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: project_conflict; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.project_conflict (
    id character varying NOT NULL,
    project_id character varying NOT NULL,
    model_id character varying NOT NULL,
    entity_type character varying NOT NULL,
    entity_id character varying NOT NULL,
    entity_name character varying,
    conflict_type character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    base_value jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_value jsonb,
    resolution_type character varying,
    resolved_at timestamp without time zone,
    conflicting_fields text[] DEFAULT '{}'::text[] NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: project_conflict_change; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.project_conflict_change (
    id character varying NOT NULL,
    conflict_id character varying NOT NULL,
    user_id character varying NOT NULL,
    proposed_value jsonb NOT NULL,
    operation jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: project_conflict_vote; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.project_conflict_vote (
    id character varying NOT NULL,
    conflict_id character varying NOT NULL,
    field_name character varying NOT NULL,
    voter_user_id character varying NOT NULL,
    change_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: project_history; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.project_history (
    id character varying(255) NOT NULL,
    project_id character varying(255) NOT NULL,
    model_id character varying(255),
    user_id character varying(255),
    action_type character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id character varying(255),
    entity_name text,
    old_value jsonb,
    new_value jsonb,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reviewer; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.reviewer (
    id integer NOT NULL,
    email text NOT NULL,
    "languageReviewId" integer
);


--
-- Name: reviewer_id_seq; Type: SEQUENCE; Schema: variamos; Owner: -
--

CREATE SEQUENCE variamos.reviewer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviewer_id_seq; Type: SEQUENCE OWNED BY; Schema: variamos; Owner: -
--

ALTER SEQUENCE variamos.reviewer_id_seq OWNED BY variamos.reviewer.id;


--
-- Name: role; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.role (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: role_permission; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.role_permission (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: variamos; Owner: -
--

ALTER TABLE variamos.role ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME variamos.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos."user" (
    id text NOT NULL,
    "user" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    country_code character varying(10),
    is_enabled boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login timestamp with time zone,
    password character varying(255)
);


--
-- Name: user_language; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.user_language (
    user_id text NOT NULL,
    language_id integer NOT NULL,
    access_level character varying(10) DEFAULT 'OWNER'::character varying NOT NULL
);


--
-- Name: user_project; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.user_project (
    user_id text NOT NULL,
    project_id text NOT NULL,
    role character varying(255) DEFAULT ''::character varying
);


--
-- Name: user_role; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.user_role (
    user_id text NOT NULL,
    role_id integer NOT NULL
);


--
-- Name: user_visit; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.user_visit (
    user_id text NOT NULL,
    country_code character varying(2),
    visit_date date NOT NULL
);


--
-- Name: view_users_languages; Type: VIEW; Schema: variamos; Owner: -
--

CREATE VIEW variamos.view_users_languages AS
 SELECT u.id,
    u.name,
    u.email,
    ur.language_id,
    r.name AS language
   FROM ((variamos."user" u
     LEFT JOIN variamos.user_language ur ON ((ur.user_id = u.id)))
     LEFT JOIN variamos.language r ON ((r.id = ur.language_id)))
  ORDER BY u.name, r.name;


--
-- Name: view_users_roles; Type: VIEW; Schema: variamos; Owner: -
--

CREATE VIEW variamos.view_users_roles AS
 SELECT u.id,
    u.name,
    u.email,
    ur.role_id,
    r.name AS role
   FROM ((variamos."user" u
     LEFT JOIN variamos.user_role ur ON ((ur.user_id = u.id)))
     LEFT JOIN variamos.role r ON ((r.id = ur.role_id)))
  ORDER BY u.name, r.name;


--
-- Name: visits_summary; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.visits_summary (
    page_id text NOT NULL,
    unique_visits bigint DEFAULT 0 NOT NULL,
    visits bigint DEFAULT 0 NOT NULL,
    visits_date date NOT NULL
);


--
-- Name: yearly_visits_summary; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE variamos.yearly_visits_summary (
    count bigint NOT NULL,
    visit_year date NOT NULL,
    country_code character varying(2)
);


--
-- Name: comment id; Type: DEFAULT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.comment ALTER COLUMN id SET DEFAULT nextval('variamos.comment_id_seq'::regclass);


--
-- Name: external_function id; Type: DEFAULT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.external_function ALTER COLUMN id SET DEFAULT nextval('variamos.external_function_id_seq'::regclass);


--
-- Name: language id; Type: DEFAULT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.language ALTER COLUMN id SET DEFAULT nextval('variamos."languageRegistry_id_seq"'::regclass);


--
-- Name: language_review id; Type: DEFAULT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.language_review ALTER COLUMN id SET DEFAULT nextval('variamos.language_review_id_seq'::regclass);


--
-- Name: reviewer id; Type: DEFAULT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.reviewer ALTER COLUMN id SET DEFAULT nextval('variamos.reviewer_id_seq'::regclass);


--
-- Name: comment PK_0b0e4bbc8415ec426f87f3a88e2; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.comment
    ADD CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY (id);


--
-- Name: reviewer PK_677dfc9088091c469b6ee6a9c93; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.reviewer
    ADD CONSTRAINT "PK_677dfc9088091c469b6ee6a9c93" PRIMARY KEY (id);


--
-- Name: language_review PK_8e272e5756184175c5e4eb7ff89; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.language_review
    ADD CONSTRAINT "PK_8e272e5756184175c5e4eb7ff89" PRIMARY KEY (id);


--
-- Name: bug_attachments bug_attachments_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.bug_attachments
    ADD CONSTRAINT bug_attachments_pkey PRIMARY KEY (id);


--
-- Name: bug_notes bug_notes_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.bug_notes
    ADD CONSTRAINT bug_notes_pkey PRIMARY KEY (id);


--
-- Name: bug_status_logs bug_status_logs_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.bug_status_logs
    ADD CONSTRAINT bug_status_logs_pkey PRIMARY KEY (id);


--
-- Name: bugs bugs_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.bugs
    ADD CONSTRAINT bugs_pkey PRIMARY KEY (id);


--
-- Name: country country_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.country
    ADD CONSTRAINT country_pkey PRIMARY KEY (code);


--
-- Name: external_function external_function_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.external_function
    ADD CONSTRAINT external_function_pkey PRIMARY KEY (id);


--
-- Name: language languageRegistry_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.language
    ADD CONSTRAINT "languageRegistry_pkey" PRIMARY KEY (id);


--
-- Name: model_configuration model_configuration_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.model_configuration
    ADD CONSTRAINT model_configuration_pkey PRIMARY KEY (id);


--
-- Name: model model_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.model
    ADD CONSTRAINT model_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_hash_key; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id);


--
-- Name: project_annotation project_annotation_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_annotation
    ADD CONSTRAINT project_annotation_pkey PRIMARY KEY (id);


--
-- Name: project_conflict_change project_conflict_change_conflict_id_user_id_key; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict_change
    ADD CONSTRAINT project_conflict_change_conflict_id_user_id_key UNIQUE (conflict_id, user_id);


--
-- Name: project_conflict_change project_conflict_change_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict_change
    ADD CONSTRAINT project_conflict_change_pkey PRIMARY KEY (id);


--
-- Name: project_conflict project_conflict_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict
    ADD CONSTRAINT project_conflict_pkey PRIMARY KEY (id);


--
-- Name: project_conflict_vote project_conflict_vote_conflict_id_field_name_voter_user_id_key; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict_vote
    ADD CONSTRAINT project_conflict_vote_conflict_id_field_name_voter_user_id_key UNIQUE (conflict_id, field_name, voter_user_id);


--
-- Name: project_conflict_vote project_conflict_vote_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict_vote
    ADD CONSTRAINT project_conflict_vote_pkey PRIMARY KEY (id);


--
-- Name: project_history project_history_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_history
    ADD CONSTRAINT project_history_pkey PRIMARY KEY (id);


--
-- Name: project project_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


--
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: language unique_language_name; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.language
    ADD CONSTRAINT unique_language_name UNIQUE (name);


--
-- Name: user_language user_language_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.user_language
    ADD CONSTRAINT user_language_pkey PRIMARY KEY (user_id, language_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user_project user_project_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.user_project
    ADD CONSTRAINT user_project_pkey PRIMARY KEY (user_id, project_id);


--
-- Name: user_role user_role_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_visit user_visit_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.user_visit
    ADD CONSTRAINT user_visit_pkey PRIMARY KEY (user_id, visit_date);


--
-- Name: visits_summary visits_summary_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.visits_summary
    ADD CONSTRAINT visits_summary_pkey PRIMARY KEY (page_id, visits_date);


--
-- Name: yearly_visits_summary yearly_visits_summary_pkey; Type: CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.yearly_visits_summary
    ADD CONSTRAINT yearly_visits_summary_pkey PRIMARY KEY (count, visit_year);


--
-- Name: idx_conflict_change_conflict; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_conflict_change_conflict ON variamos.project_conflict_change USING btree (conflict_id);


--
-- Name: idx_conflict_change_user; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_conflict_change_user ON variamos.project_conflict_change USING btree (user_id);


--
-- Name: idx_conflict_vote_change; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_conflict_vote_change ON variamos.project_conflict_vote USING btree (change_id);


--
-- Name: idx_conflict_vote_conflict; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_conflict_vote_conflict ON variamos.project_conflict_vote USING btree (conflict_id);


--
-- Name: idx_model_config_model_id; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_model_config_model_id ON variamos.model_configuration USING btree (model_id);


--
-- Name: idx_model_engineering_type; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_model_engineering_type ON variamos.model USING btree (engineering_type);


--
-- Name: idx_model_language_id; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_model_language_id ON variamos.model USING btree (language_id);


--
-- Name: idx_model_project_id; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_model_project_id ON variamos.model USING btree (project_id);


--
-- Name: idx_password_reset_tokens_hash; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_password_reset_tokens_hash ON variamos.password_reset_tokens USING btree (token_hash);


--
-- Name: idx_project_conflict_created; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_project_conflict_created ON variamos.project_conflict USING btree (created_at DESC);


--
-- Name: idx_project_conflict_entity; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_project_conflict_entity ON variamos.project_conflict USING btree (entity_id);


--
-- Name: idx_project_conflict_model; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_project_conflict_model ON variamos.project_conflict USING btree (model_id);


--
-- Name: idx_project_conflict_project; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_project_conflict_project ON variamos.project_conflict USING btree (project_id);


--
-- Name: idx_project_conflict_status; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX idx_project_conflict_status ON variamos.project_conflict USING btree (status);


--
-- Name: ix_project_conflict_status_expires_at; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX ix_project_conflict_status_expires_at ON variamos.project_conflict USING btree (status, expires_at);


--
-- Name: page_visit_idx; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX page_visit_idx ON variamos.page_visit USING btree (page_id, country_code, visit_date) WITH (deduplicate_items='true');


--
-- Name: yearly_visits_summary_idx; Type: INDEX; Schema: variamos; Owner: -
--

CREATE INDEX yearly_visits_summary_idx ON variamos.yearly_visits_summary USING btree (country_code, visit_year DESC) WITH (deduplicate_items='true');


--
-- Name: user after_insert_user; Type: TRIGGER; Schema: variamos; Owner: -
--

CREATE TRIGGER after_insert_user AFTER INSERT ON variamos."user" FOR EACH ROW EXECUTE FUNCTION variamos.insert_user_role();


--
-- Name: comment FK_09e2bf9083b8d7320a8fd5742a8; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.comment
    ADD CONSTRAINT "FK_09e2bf9083b8d7320a8fd5742a8" FOREIGN KEY ("languageReviewId") REFERENCES variamos.language_review(id);


--
-- Name: reviewer FK_60b21ea0d240eaafe5a7f2ce433; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.reviewer
    ADD CONSTRAINT "FK_60b21ea0d240eaafe5a7f2ce433" FOREIGN KEY ("languageReviewId") REFERENCES variamos.language_review(id);


--
-- Name: bug_attachments fk_bug_attachments_bug; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.bug_attachments
    ADD CONSTRAINT fk_bug_attachments_bug FOREIGN KEY (bug_id) REFERENCES variamos.bugs(id) ON DELETE CASCADE;


--
-- Name: bug_notes fk_bug_notes_author; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.bug_notes
    ADD CONSTRAINT fk_bug_notes_author FOREIGN KEY (author_id) REFERENCES variamos."user"(id) ON DELETE SET NULL;


--
-- Name: bug_notes fk_bug_notes_bug; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.bug_notes
    ADD CONSTRAINT fk_bug_notes_bug FOREIGN KEY (bug_id) REFERENCES variamos.bugs(id) ON DELETE CASCADE;


--
-- Name: bug_status_logs fk_bug_status_logs_bug; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.bug_status_logs
    ADD CONSTRAINT fk_bug_status_logs_bug FOREIGN KEY (bug_id) REFERENCES variamos.bugs(id) ON DELETE CASCADE;


--
-- Name: bug_status_logs fk_bug_status_logs_operator; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.bug_status_logs
    ADD CONSTRAINT fk_bug_status_logs_operator FOREIGN KEY (operator_id) REFERENCES variamos."user"(id) ON DELETE SET NULL;


--
-- Name: project_annotation fk_project_annotation_project; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_annotation
    ADD CONSTRAINT fk_project_annotation_project FOREIGN KEY (project_id) REFERENCES variamos.project(id) ON DELETE CASCADE;


--
-- Name: project_annotation fk_project_annotation_user; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_annotation
    ADD CONSTRAINT fk_project_annotation_user FOREIGN KEY (user_id) REFERENCES variamos."user"(id) ON DELETE SET NULL;


--
-- Name: project_history fk_project_history_project; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_history
    ADD CONSTRAINT fk_project_history_project FOREIGN KEY (project_id) REFERENCES variamos.project(id) ON DELETE CASCADE;


--
-- Name: project_history fk_project_history_user; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_history
    ADD CONSTRAINT fk_project_history_user FOREIGN KEY (user_id) REFERENCES variamos."user"(id) ON DELETE SET NULL;


--
-- Name: project fk_project_owner_id_user; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project
    ADD CONSTRAINT fk_project_owner_id_user FOREIGN KEY (owner_id) REFERENCES variamos."user"(id);


--
-- Name: model_configuration model_configuration_model_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.model_configuration
    ADD CONSTRAINT model_configuration_model_id_fkey FOREIGN KEY (model_id) REFERENCES variamos.model(id) ON DELETE CASCADE;


--
-- Name: model model_language_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.model
    ADD CONSTRAINT model_language_id_fkey FOREIGN KEY (language_id) REFERENCES variamos.language(id);


--
-- Name: model model_project_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.model
    ADD CONSTRAINT model_project_id_fkey FOREIGN KEY (project_id) REFERENCES variamos.project(id) ON DELETE CASCADE;


--
-- Name: page_visit page_visit_country_fk; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.page_visit
    ADD CONSTRAINT page_visit_country_fk FOREIGN KEY (country_code) REFERENCES variamos.country(code);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES variamos."user"(id) ON DELETE CASCADE;


--
-- Name: role_permission permission_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.role_permission
    ADD CONSTRAINT permission_fkey FOREIGN KEY (permission_id) REFERENCES variamos.permission(id);


--
-- Name: project_conflict_change project_conflict_change_conflict_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict_change
    ADD CONSTRAINT project_conflict_change_conflict_id_fkey FOREIGN KEY (conflict_id) REFERENCES variamos.project_conflict(id) ON DELETE CASCADE;


--
-- Name: project_conflict_change project_conflict_change_user_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict_change
    ADD CONSTRAINT project_conflict_change_user_id_fkey FOREIGN KEY (user_id) REFERENCES variamos."user"(id);


--
-- Name: project_conflict project_conflict_project_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict
    ADD CONSTRAINT project_conflict_project_id_fkey FOREIGN KEY (project_id) REFERENCES variamos.project(id) ON DELETE CASCADE;


--
-- Name: project_conflict_vote project_conflict_vote_change_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict_vote
    ADD CONSTRAINT project_conflict_vote_change_id_fkey FOREIGN KEY (change_id) REFERENCES variamos.project_conflict_change(id) ON DELETE CASCADE;


--
-- Name: project_conflict_vote project_conflict_vote_conflict_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict_vote
    ADD CONSTRAINT project_conflict_vote_conflict_id_fkey FOREIGN KEY (conflict_id) REFERENCES variamos.project_conflict(id) ON DELETE CASCADE;


--
-- Name: project_conflict_vote project_conflict_vote_voter_user_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.project_conflict_vote
    ADD CONSTRAINT project_conflict_vote_voter_user_id_fkey FOREIGN KEY (voter_user_id) REFERENCES variamos."user"(id);


--
-- Name: role_permission role_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.role_permission
    ADD CONSTRAINT role_fkey FOREIGN KEY (role_id) REFERENCES variamos.role(id);


--
-- Name: user_language user_language_language_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.user_language
    ADD CONSTRAINT user_language_language_id_fkey FOREIGN KEY (language_id) REFERENCES variamos.language(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- Name: user_language user_language_user_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.user_language
    ADD CONSTRAINT user_language_user_id_fkey FOREIGN KEY (user_id) REFERENCES variamos."user"(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- Name: user_project user_project_project_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.user_project
    ADD CONSTRAINT user_project_project_id_fkey FOREIGN KEY (project_id) REFERENCES variamos.project(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_project user_project_user_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.user_project
    ADD CONSTRAINT user_project_user_id_fkey FOREIGN KEY (user_id) REFERENCES variamos."user"(id);


--
-- Name: user_role user_role_role_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.user_role
    ADD CONSTRAINT user_role_role_id_fkey FOREIGN KEY (role_id) REFERENCES variamos.role(id);


--
-- Name: user_role user_role_user_id_fkey; Type: FK CONSTRAINT; Schema: variamos; Owner: -
--

ALTER TABLE ONLY variamos.user_role
    ADD CONSTRAINT user_role_user_id_fkey FOREIGN KEY (user_id) REFERENCES variamos."user"(id);


--
-- Name: configurations; Type: TABLE; Schema: variamos; Owner: -
--

CREATE TABLE IF NOT EXISTS variamos.configurations (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    type VARCHAR(30) NOT NULL,
    category VARCHAR(50) NOT NULL,
    requires_mfa BOOLEAN DEFAULT FALSE,
    is_secret BOOLEAN DEFAULT FALSE,
    environment_scope VARCHAR(20) DEFAULT 'all',
    is_read_only BOOLEAN DEFAULT FALSE,
    target_services VARCHAR(50)[] NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_configurations_key ON variamos.configurations(key);
CREATE INDEX IF NOT EXISTS idx_configurations_category ON variamos.configurations(category);
CREATE INDEX IF NOT EXISTS idx_configurations_env ON variamos.configurations(environment_scope);

--
-- PostgreSQL database dump complete
--


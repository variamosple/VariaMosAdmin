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
-- Data for Name: country; Type: TABLE DATA; Schema: variamos; Owner: -
--

COPY variamos.country (code, name, latitude, longitude, code3) FROM stdin;
AD	Andorra	42.546245	1.601554	AND
AE	United Arab Emirates	23.424076	53.847818	UAE
AF	Afghanistan	33.93911	67.709953	AFG
AG	Antigua and Barbuda	17.060816	-61.796428	ATG
AI	Anguilla	18.220554	-63.068615	AIA
AL	Albania	41.153332	20.168331	ALB
AM	Armenia	40.069099	45.038189	ARM
AN	Netherlands Antilles	12.226079	-69.060087	ANT
AO	Angola	-11.202692	17.873887	AGO
AQ	Antarctica	-75.250973	-0.071389	ATA
AR	Argentina	-38.416097	-63.616672	ARG
AS	American Samoa	-14.270972	-170.132217	ASM
AT	Austria	47.516231	14.550072	AUT
AU	Australia	-25.274398	133.775136	AUS
AW	Aruba	12.52111	-69.968338	ABW
AZ	Azerbaijan	40.143105	47.576927	AZE
BA	Bosnia and Herzegovina	43.915886	17.679076	BIH
BB	Barbados	13.193887	-59.543198	BRB
BD	Bangladesh	23.684994	90.356331	BGD
BE	Belgium	50.503887	4.469936	BEL
BF	Burkina Faso	12.238333	-1.561593	BFA
BG	Bulgaria	42.733883	25.48583	BGR
BH	Bahrain	25.930414	50.637772	BHR
BI	Burundi	-3.373056	29.918886	BDI
BJ	Benin	9.30769	2.315834	BEN
BM	Bermuda	32.321384	-64.75737	BMU
BN	Brunei	4.535277	114.727669	BRN
BO	Bolivia	-16.290154	-63.588653	BOL
BR	Brazil	-14.235004	-51.92528	BRA
BS	Bahamas	25.03428	-77.39628	BHS
BT	Bhutan	27.514162	90.433601	BTN
BV	Bouvet Island	-54.423199	3.413194	BVT
BW	Botswana	-22.328474	24.684866	BWA
BY	Belarus	53.709807	27.953389	BLR
BZ	Belize	17.189877	-88.49765	BLZ
CA	Canada	56.130366	-106.346771	CAN
CC	Cocos [Keeling] Islands	-12.164165	96.870956	CCK
CD	Congo [DRC]	-4.038333	21.758664	COD
CF	Central African Republic	6.611111	20.939444	CAF
CG	Congo [Republic]	-0.228021	15.827659	COG
CH	Switzerland	46.818188	8.227512	CHE
CI	Côte d'Ivoire	7.539989	-5.54708	CIV
CL	Chile	-35.675147	-71.542969	CHL
CM	Cameroon	7.369722	12.354722	CMR
CN	China	35.86166	104.195397	CHN
CO	Colombia	4.570868	-74.297333	COL
CR	Costa Rica	9.748917	-83.753428	CRI
CU	Cuba	21.521757	-77.781167	CUB
CV	Cape Verde	16.002082	-24.013197	CPV
CX	Christmas Island	-10.447525	105.690449	CXR
CY	Cyprus	35.126413	33.429859	CYP
CZ	Czech Republic	49.817492	15.472962	CZE
DE	Germany	51.165691	10.451526	DEU
DJ	Djibouti	11.825138	42.590275	DJI
DK	Denmark	56.26392	9.501785	DNK
DM	Dominica	15.414999	-61.370976	DMA
DO	Dominican Republic	18.735693	-70.162651	DOM
DZ	Algeria	28.033886	1.659626	DZA
EC	Ecuador	-1.831239	-78.183406	ECU
EE	Estonia	58.595272	25.013607	EST
EG	Egypt	26.820553	30.802498	EGY
EH	Western Sahara	24.215527	-12.885834	ESH
ER	Eritrea	15.179384	39.782334	ERI
ES	Spain	40.463667	-3.74922	ESP
ET	Ethiopia	9.145	40.489673	ETH
FI	Finland	61.92411	25.748151	FIN
FJ	Fiji	-16.578193	179.414413	FJI
FK	Falkland Islands [Islas Malvinas]	-51.796253	-59.523613	FLK
FM	Micronesia	7.425554	150.550812	FSM
FO	Faroe Islands	61.892635	-6.911806	FRO
FR	France	46.227638	2.213749	FRA
GA	Gabon	-0.803689	11.609444	GAB
GB	United Kingdom	55.378051	-3.435973	GBR
GD	Grenada	12.262776	-61.604171	GRD
GE	Georgia	42.315407	43.356892	GEO
GF	French Guiana	3.933889	-53.125782	GUF
GG	Guernsey	49.465691	-2.585278	GGY
GH	Ghana	7.946527	-1.023194	GHA
GI	Gibraltar	36.137741	-5.345374	GIB
GL	Greenland	71.706936	-42.604303	GRL
GM	Gambia	13.443182	-15.310139	GMB
GN	Guinea	9.945587	-9.696645	GIN
GP	Guadeloupe	16.995971	-62.067641	GLP
GQ	Equatorial Guinea	1.650801	10.267895	EQG
GR	Greece	39.074208	21.824312	GRC
GS	South Georgia and the South Sandwich Islands	-54.429579	-36.587909	SGS
GT	Guatemala	15.783471	-90.230759	GTM
GU	Guam	13.444304	144.793731	GUM
GW	Guinea-Bissau	11.803749	-15.180413	GNB
GY	Guyana	4.860416	-58.93018	GUY
GZ	Gaza Strip	31.354676	34.308825	GZA
HK	Hong Kong	22.396428	114.109497	HKG
HM	Heard Island and McDonald Islands	-53.08181	73.504158	HMD
HN	Honduras	15.199999	-86.241905	HND
HR	Croatia	45.1	15.2	HRV
HT	Haiti	18.971187	-72.285215	HTI
HU	Hungary	47.162494	19.503304	HUN
ID	Indonesia	-0.789275	113.921327	IDN
IE	Ireland	53.41291	-8.24389	IRL
IL	Israel	31.046051	34.851612	ISR
IM	Isle of Man	54.236107	-4.548056	IMN
IN	India	20.593684	78.96288	IND
IO	British Indian Ocean Territory	-6.343194	71.876519	IOT
IQ	Iraq	33.223191	43.679291	IRQ
IR	Iran	32.427908	53.688046	IRN
IS	Iceland	64.963051	-19.020835	ISL
IT	Italy	41.87194	12.56738	ITA
JE	Jersey	49.214439	-2.13125	JEY
JM	Jamaica	18.109581	-77.297508	JAM
JO	Jordan	30.585164	36.238414	JOR
JP	Japan	36.204824	138.252924	JPN
KE	Kenya	-0.023559	37.906193	KEN
KG	Kyrgyzstan	41.20438	74.766098	KGZ
KH	Cambodia	12.565679	104.990963	KHM
KI	Kiribati	-3.370417	-168.734039	KIR
KM	Comoros	-11.875001	43.872219	COM
KN	Saint Kitts and Nevis	17.357822	-62.782998	KNA
KP	North Korea	40.339852	127.510093	PRK
KR	South Korea	35.907757	127.766922	KOR
KW	Kuwait	29.31166	47.481766	KWT
KY	Cayman Islands	19.513469	-80.566956	CYM
KZ	Kazakhstan	48.019573	66.923684	KAZ
LA	Laos	19.85627	102.495496	LAO
LB	Lebanon	33.854721	35.862285	LBN
LC	Saint Lucia	13.909444	-60.978893	LCA
LI	Liechtenstein	47.166	9.555373	LIE
LK	Sri Lanka	7.873054	80.771797	LKA
LR	Liberia	6.428055	-9.429499	LBR
LS	Lesotho	-29.609988	28.233608	LSO
LT	Lithuania	55.169438	23.881275	LTU
LU	Luxembourg	49.815273	6.129583	LUX
LV	Latvia	56.879635	24.603189	LVA
LY	Libya	26.3351	17.228331	LBY
MA	Morocco	31.791702	-7.09262	MAR
MC	Monaco	43.750298	7.412841	MCO
MD	Moldova	47.411631	28.369885	MDA
ME	Montenegro	42.708678	19.37439	MNE
MG	Madagascar	-18.766947	46.869107	MDG
MH	Marshall Islands	7.131474	171.184478	MHL
MK	Macedonia [FYROM]	41.608635	21.745275	MKD
ML	Mali	17.570692	-3.996166	MLI
MM	Myanmar [Burma]	21.913965	95.956223	MMR
MN	Mongolia	46.862496	103.846656	MNG
MO	Macau	22.198745	113.543873	MAC
MP	Northern Mariana Islands	17.33083	145.38469	MNP
MQ	Martinique	14.641528	-61.024174	MTQ
MR	Mauritania	21.00789	-10.940835	MRT
MS	Montserrat	16.742498	-62.187366	MSR
MT	Malta	35.937496	14.375416	MLT
MU	Mauritius	-20.348404	57.552152	MUS
MV	Maldives	3.202778	73.22068	MDV
MW	Malawi	-13.254308	34.301525	MWI
MX	Mexico	23.634501	-102.552784	MEX
MY	Malaysia	4.210484	101.975766	MYS
MZ	Mozambique	-18.665695	35.529562	MOZ
NA	Namibia	-22.95764	18.49041	NAM
NC	New Caledonia	-20.904305	165.618042	NCL
NE	Niger	17.607789	8.081666	NER
NF	Norfolk Island	-29.040835	167.954712	NFK
NG	Nigeria	9.081999	8.675277	NGA
NI	Nicaragua	12.865416	-85.207229	NIC
NL	Netherlands	52.132633	5.291266	NLD
NO	Norway	60.472024	8.468946	NOR
NP	Nepal	28.394857	84.124008	NPL
NR	Nauru	-0.522778	166.931503	NRU
NU	Niue	-19.054445	-169.867233	NIU
NZ	New Zealand	-40.900557	174.885971	NZL
OM	Oman	21.512583	55.923255	OMN
PA	Panama	8.537981	-80.782127	PAN
PE	Peru	-9.189967	-75.015152	PER
PF	French Polynesia	-17.679742	-149.406843	PYF
PG	Papua New Guinea	-6.314993	143.95555	PNG
PH	Philippines	12.879721	121.774017	PHL
PK	Pakistan	30.375321	69.345116	PAK
PL	Poland	51.919438	19.145136	POL
PM	Saint Pierre and Miquelon	46.941936	-56.27111	SPM
PN	Pitcairn Islands	-24.703615	-127.439308	PCN
PR	Puerto Rico	18.220833	-66.590149	PRI
PS	Palestinian Territories	31.952162	35.233154	PSE
PT	Portugal	39.399872	-8.224454	PRT
PW	Palau	7.51498	134.58252	PLW
PY	Paraguay	-23.442503	-58.443832	PRY
QA	Qatar	25.354826	51.183884	QAT
RE	Réunion	-21.115141	55.536384	REU
RO	Romania	45.943161	24.96676	ROU
RS	Serbia	44.016521	21.005859	SRB
RU	Russia	61.52401	105.318756	RUS
RW	Rwanda	-1.940278	29.873888	RWA
SA	Saudi Arabia	23.885942	45.079162	SAU
SB	Solomon Islands	-9.64571	160.156194	SLB
SC	Seychelles	-4.679574	55.491977	SYC
SD	Sudan	12.862807	30.217636	SDN
SE	Sweden	60.128161	18.643501	SWE
SG	Singapore	1.352083	103.819836	SGP
SH	Saint Helena	-24.143474	-10.030696	SHN
SI	Slovenia	46.151241	14.995463	SVN
SJ	Svalbard and Jan Mayen	77.553604	23.670272	SJM
SK	Slovakia	48.669026	19.699024	SVK
SL	Sierra Leone	8.460555	-11.779889	SLE
SM	San Marino	43.94236	12.457777	SMR
SN	Senegal	14.497401	-14.452362	SEN
SO	Somalia	5.152149	46.199616	SOM
SR	Suriname	3.919305	-56.027783	SUR
ST	São Tomé and Príncipe	0.18636	6.613081	STP
SV	El Salvador	13.794185	-88.89653	SLV
SY	Syria	34.802075	38.996815	SYR
SZ	Swaziland	-26.522503	31.465866	SWZ
TC	Turks and Caicos Islands	21.694025	-71.797928	TCI
TD	Chad	15.454166	18.732207	TCD
TF	French Southern Territories	-49.280366	69.348557	ATF
TG	Togo	8.619543	0.824782	TGO
TH	Thailand	15.870032	100.992541	THA
TJ	Tajikistan	38.861034	71.276093	TJK
TK	Tokelau	-8.967363	-171.855881	TKL
TL	Timor-Leste	-8.874217	125.727539	TLS
TM	Turkmenistan	38.969719	59.556278	TKM
TN	Tunisia	33.886917	9.537499	TUN
TO	Tonga	-21.178986	-175.198242	TON
TR	Turkey	38.963745	35.243322	TUR
TT	Trinidad and Tobago	10.691803	-61.222503	TTO
TV	Tuvalu	-7.109535	177.64933	TVL
TW	Taiwan	23.69781	120.960515	TWN
TZ	Tanzania	-6.369028	34.888822	TZA
UA	Ukraine	48.379433	31.16558	UKR
UG	Uganda	1.373333	32.290275	UGA
US	United States	37.09024	-95.712891	USA
UY	Uruguay	-32.522779	-55.765835	URY
UZ	Uzbekistan	41.377491	64.585262	UZB
VA	Vatican City	41.902916	12.453389	VAT
VC	Saint Vincent and the Grenadines	12.984305	-61.287228	VCT
VE	Venezuela	6.42375	-66.58973	VEN
VG	British Virgin Islands	18.420695	-64.639968	VGB
VI	U.S. Virgin Islands	18.335765	-64.896335	VIR
VN	Vietnam	14.058324	108.277199	VNM
VU	Vanuatu	-15.376706	166.959158	VUT
WF	Wallis and Futuna	-13.768752	-177.156097	WLF
WS	Samoa	-13.759029	-172.104629	WSM
XK	Kosovo	42.602636	20.902977	XKX
YE	Yemen	15.552727	48.516388	YEM
YT	Mayotte	-12.8275	45.166244	MYT
ZA	South Africa	-30.559482	22.937506	ZAF
ZM	Zambia	-13.133897	27.849332	ZMB
ZW	Zimbabwe	-19.015438	29.154857	ZWE
\.


--
-- Data for Name: permission; Type: TABLE DATA; Schema: variamos; Owner: -
--

COPY variamos.permission (id, name) FROM stdin;
4	users::query
5	users::update
6	roles::query
7	roles::update
8	roles::create
9	roles::delete
10	permissions::create
11	permissions::query
12	permissions::delete
13	permissions::update
14	micro-services::query
15	metrics::query
16	micro-services::update
17	users::delete
18	my-account::query
19	my-account::update
20	languages::create
21	languages::delete
22	languages::query
23	languages::update
24	admin::projects::update
25	admin::projects::query
26	admin::projects::delete
27	admin::models::query
28	admin::models::update
29	admin::models::delete
30	admin::languages::delete
31	admin::languages::update
32	admin::languages::query
33	bugs::query
3	product-line::create
2	languages::approve
1	deprecated-duplicate-languages::create
34	languages::get::own
35	languages::get::public
36	languages::get::all
37	languages::update::all
38	languages::update::own
39	languages::publish::all
40	languages::delete::all
41	languages::delete::own
42	languages::manage-collaborators::own
43	languages::manage-collaborators::all
\.


--
-- Data for Name: role; Type: TABLE DATA; Schema: variamos; Owner: -
--

COPY variamos.role (id, name) FROM stdin;
1	Administrator
2	Language developer
3	Product line designer
4	Language director
6	Guest
\.


--
-- Data for Name: role_permission; Type: TABLE DATA; Schema: variamos; Owner: -
--

COPY variamos.role_permission (role_id, permission_id) FROM stdin;
2	1
4	2
2	3
3	3
4	3
4	1
1	8
1	9
1	6
1	7
1	10
1	12
1	11
1	13
1	4
1	5
1	15
1	14
1	16
1	17
2	18
2	19
2	20
2	22
2	23
2	21
6	22
1	26
1	25
1	24
1	27
1	29
1	28
1	30
1	32
1	31
1	33
1	40
1	41
1	36
1	34
1	35
1	39
1	37
1	38
2	41
2	34
2	35
2	38
3	35
3	34
4	40
4	41
4	36
4	34
4	39
4	37
4	38
6	35
1	42
2	42
3	42
4	42
1	43
\.


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: variamos; Owner: -
--

SELECT pg_catalog.setval('variamos.roles_id_seq', 7, true);


--
-- Data for Name: configurations; Type: TABLE DATA; Schema: variamos; Owner: -
--

SET search_path TO variamos;

INSERT INTO "configurations" (
    "key",
    "value",
    "type",
    "category",
    "requires_mfa",
    "is_secret",
    "environment_scope",
    "is_read_only",
    "target_services",
    "description",
    "updated_by",
    "created_at",
    "updated_at"
) VALUES
-- GENERAL
(
    'general.site_name',
    '"VariaMos"'::jsonb,
    'string',
    'general',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['all']::varchar[],
    'Platform name displayed on the user interface.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'general.default_language',
    '"en"'::jsonb,
    'string',
    'general',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['all']::varchar[],
    'Default language of the application (e.g. "fr", "en").',
    'system_seed',
    NOW(),
    NOW()
),
(
    'general.admin_home_uri',
    '"http://localhost:3000"'::jsonb,
    'string',
    'general',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['all']::varchar[],
    'Welcome URI of the administration dashboard.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'general.api_base_url',
    '"http://localhost:4000"'::jsonb,
    'string',
    'general',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['all']::varchar[],
    'Root URL of the global API microservice.',
    'system_seed',
    NOW(),
    NOW()
),

-- SECURITY (requires_mfa is set to FALSE since MFA is not yet implemented on the frontend)
(
    'security.password.min_length',
    '12'::jsonb,
    'number',
    'security',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['variamos_ms_security']::varchar[],
    'Minimum length required for user passwords.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'security.password.require_special',
    'true'::jsonb,
    'boolean',
    'security',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['variamos_ms_security']::varchar[],
    'Require a special character in user passwords.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'security.password.require_numbers',
    'true'::jsonb,
    'boolean',
    'security',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['variamos_ms_security']::varchar[],
    'Require at least one digit in user passwords.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'security.password.require_uppercase',
    'true'::jsonb,
    'boolean',
    'security',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['variamos_ms_security']::varchar[],
    'Require at least one uppercase letter.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'security.password.reset_expiry',
    '86400000'::jsonb, -- 24 hours in ms
    'number',
    'security',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['variamos_ms_security']::varchar[],
    'Password reset token expiration time (in milliseconds).',
    'system_seed',
    NOW(),
    NOW()
),
(
    'security.bcrypt_salt_rounds',
    '10'::jsonb,
    'number',
    'security',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['variamos_ms_security']::varchar[],
    'Bcrypt salt rounds for password hashing.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'security.mfa.global_enabled',
    'false'::jsonb,
    'boolean',
    'security',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['variamos_ms_security', 'variamos_ms_admin']::varchar[],
    'Indicates if Multi-Factor Authentication (MFA) is globally required.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'security.cookie.max_age',
    '86400000'::jsonb, -- 24 hours in ms
    'number',
    'security',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['all']::varchar[],
    'Maximum expiration time for session cookies (in milliseconds).',
    'system_seed',
    NOW(),
    NOW()
),

-- NOTIFICATION
(
    'notification.smtp.host',
    '"smtp-relay.brevo.com"'::jsonb,
    'string',
    'notification',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['variamos_ms_notifications']::varchar[],
    'SMTP server host for sending emails.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'notification.smtp.port',
    '587'::jsonb,
    'number',
    'notification',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['variamos_ms_notifications']::varchar[],
    'SMTP port for sending emails.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'notification.smtp.from',
    '"\"VariaMos\" <noreply@variamos.com>"'::jsonb,
    'string',
    'notification',
    FALSE,
    FALSE,
    'all',
    FALSE,
    ARRAY['variamos_ms_notifications']::varchar[],
    'Sender email address displayed on outgoing emails.',
    'system_seed',
    NOW(),
    NOW()
),
(
    'notification.smtp.user',
    '""'::jsonb,
    'string',
    'notification',
    FALSE,
    TRUE, -- Secret
    'all',
    FALSE,
    ARRAY['variamos_ms_notifications']::varchar[],
    'Username for SMTP authentication (empty by default).',
    'system_seed',
    NOW(),
    NOW()
),
(
    'notification.smtp.password',
    '""'::jsonb,
    'string',
    'notification',
    FALSE,
    TRUE, -- Secret
    'all',
    FALSE,
    ARRAY['variamos_ms_notifications']::varchar[],
    'Password for SMTP authentication (empty by default).',
    'system_seed',
    NOW(),
    NOW()
)
ON CONFLICT (key) DO NOTHING;

--
-- PostgreSQL database dump complete
--


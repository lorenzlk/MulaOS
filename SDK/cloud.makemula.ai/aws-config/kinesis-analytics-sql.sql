-- Count search phrases by host
CREATE OR REPLACE STREAM "SEARCH_PHRASE_STREAM" (
    "search_phrase" VARCHAR(64),
    "host" VARCHAR(32),
    "count" INTEGER
);

-- Count search phrases globally and by host
CREATE OR REPLACE PUMP "SEARCH_PHRASE_PUMP" AS INSERT INTO "SEARCH_PHRASE_STREAM"
SELECT STREAM 
    "search_phrase",
    "host",
    COUNT(*) as "count"
FROM "SOURCE_SQL_STREAM_001"
WHERE "search_phrase" IS NOT NULL
    AND "search_phrase" != ''
    AND "eventName" = 'mula_widget_view'
GROUP BY "search_phrase", "host", STEP("COL_timestamp" BY INTERVAL '1' MINUTE);

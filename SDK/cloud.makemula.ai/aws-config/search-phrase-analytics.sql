-- Simple stream to pass through search phrase events
CREATE OR REPLACE STREAM "SEARCH_PHRASE_STREAM" (
    "search_phrase" VARCHAR(64),
    "host" VARCHAR(32),
    "event_time" TIMESTAMP
);

-- Pass through search phrase events for mula_widget_view
CREATE OR REPLACE PUMP "SEARCH_PHRASE_PUMP" AS INSERT INTO "SEARCH_PHRASE_STREAM"
SELECT STREAM 
    "search_phrase",
    "host",
    "COL_timestamp" as "event_time"
FROM "mula-realtime-events_001"
WHERE "search_phrase" IS NOT NULL
    AND "search_phrase" <> ''
    AND "eventName" = 'mula_widget_view';

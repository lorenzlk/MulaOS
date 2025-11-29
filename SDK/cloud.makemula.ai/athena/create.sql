CREATE EXTERNAL TABLE `mula.webtag_logs`(
  `timestamp` timestamp COMMENT 'from deserializer', 
  `context` map<string,string> COMMENT 'from deserializer', 
  `properties` map<string,string> COMMENT 'from deserializer')
PARTITIONED BY ( 
  `datehour` string)
ROW FORMAT SERDE 
  'org.apache.hive.hcatalog.data.JsonSerDe' 
WITH SERDEPROPERTIES ( 
  'timestamp.formats'='yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\',yyyy-MM-dd\'T\'HH:mm:ss') 
STORED AS INPUTFORMAT 
  'org.apache.hadoop.mapred.TextInputFormat' 
OUTPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION
  's3://analytics.makemula.ai/beacon-firehose'
TBLPROPERTIES (
  'projection.datehour.format'='yyyy/MM/dd/HH', 
  'projection.datehour.interval'='1', 
  'projection.datehour.interval.unit'='HOURS', 
  'projection.datehour.range'='2025/01/01/00,NOW', 
  'projection.datehour.type'='date', 
  'projection.enabled'='true', 
  'storage.location.template'='s3://analytics.makemula.ai/beacon-firehose/${datehour}/', 
  'transient_lastDdlTime'='1743601299')
# cloud.makemula.ai

This repo needs work. Most of the S3 resources were setup manually in the AWS Web Console. The only artifact currently here is the beacon-kinesis-firehose-transformer that performs the translation of events from base64-encoded JSON to S3 log lines.

Ideally, this repo would also include the infrastructure-as-code scripts to setup requisite:

1. S3 buckets
2. CloudFront distros
3. Kinesis Firehose
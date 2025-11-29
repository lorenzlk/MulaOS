const PatternAnalyzer = require('./src/analyzers/PatternAnalyzer');

// Test with actual article URLs we know exist (from RSS feed)
const testUrls = [
  'https://www.essentiallysports.com/boxing-news-ben-whittaker-vs-benjamin-gavazi-stats-prediction-record-age-weight-height-reach-rankings-and-knockout-ratio/',
  'https://www.essentiallysports.com/tennis-news-jessica-pegula-reacts-as-a-wta-star-turns-her-old-possessions-into-a-money-making-hustle/',
  'https://www.essentiallysports.com/golf-news-tiger-woods-rory-mcilroy-big-dreams-hit-a-brutal-reality-as-pga-tour-icon-passes-a-savage-judgement/',
  'https://www.essentiallysports.com/nfl-news-patrick-mahomes-chiefs-broncos/',
  'https://www.essentiallysports.com/nba-news-lebron-james-lakers-celtics/',
];

const analyzer = new PatternAnalyzer();
const patterns = analyzer.analyze(testUrls);

console.log('\nTest Results:');
console.log('=============\n');
console.log(JSON.stringify(patterns, null, 2));


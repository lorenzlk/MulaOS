#!/usr/bin/env node

require('dotenv').config();
const https = require('https');
const { SiteTargeting } = require('../models');
const config = require('../config');

// Configuration
const GRAFANA_URL = config.grafana.url;
const GRAFANA_API_KEY = config.grafana.apiKey;
const DASHBOARD_UID = config.grafana.dashboardUid;

async function getSearchPhrasesFromDB() {
  try {
    console.log('🔍 Fetching search phrases from PostgreSQL database...');
    
    const targetingRecords = await SiteTargeting.findAll({
      where: {
        deletedAt: null // Only active records
      },
      order: [['createdAt', 'DESC']],
      attributes: ['topLevelDomain', 'searchPhrase']
    });

    // Group by domain and get unique search phrases
    const searchPhrasesByDomain = {};
    targetingRecords.forEach(record => {
      const domain = record.topLevelDomain;
      const phrase = record.searchPhrase;
      
      if (!searchPhrasesByDomain[domain]) {
        searchPhrasesByDomain[domain] = new Set();
      }
      searchPhrasesByDomain[domain].add(phrase);
    });

    // Convert to array format expected by dashboard
    const searchPhrases = [];
    Object.keys(searchPhrasesByDomain).forEach(domain => {
      searchPhrasesByDomain[domain].forEach(phrase => {
        searchPhrases.push({
          host: domain,
          searchPhrase: phrase
        });
      });
    });

    console.log(`✅ Found ${searchPhrases.length} unique search phrases across ${Object.keys(searchPhrasesByDomain).length} domains`);
    console.log('📊 Search phrases by domain:');
    Object.keys(searchPhrasesByDomain).forEach(domain => {
      console.log(`  ${domain}: ${searchPhrasesByDomain[domain].size} phrases`);
    });

    return searchPhrases;
  } catch (error) {
    console.error('❌ Error fetching search phrases from database:', error);
    return [];
  }
}

async function getDashboard() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'g-e844782f82.grafana-workspace.us-east-1.amazonaws.com',
      port: 443,
      path: `/api/dashboards/uid/${DASHBOARD_UID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GRAFANA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.dashboard) {
            resolve(result);
          } else {
            reject(new Error('Invalid dashboard response: ' + JSON.stringify(result)));
          }
        } catch (e) {
          reject(new Error('Error parsing dashboard response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function updateDashboard(dashboard, searchPhrases) {
  return new Promise((resolve, reject) => {
    // Get existing panels
    const existingPanels = dashboard.dashboard.panels || [];
    console.log(`📊 Found ${existingPanels.length} existing panels in dashboard`);

    // Create a map of existing panels by their search phrase key
    const existingPanelsMap = new Map();
    existingPanels.forEach(panel => {
      if (panel.targets && panel.targets[0] && panel.targets[0].dimensions) {
        const host = panel.targets[0].dimensions.Host;
        const searchPhrase = panel.targets[0].dimensions.SearchPhrase;
        if (host && searchPhrase) {
          const key = `${host}:${searchPhrase}`;
          existingPanelsMap.set(key, panel);
        }
      }
    });

    // Calculate the maximum Y position to place new panels below existing ones
    const maxY = Math.max(...existingPanels.map(p => (p.gridPos?.y || 0) + (p.gridPos?.h || 6)), 0);
    const startY = maxY + 6; // Start new panels below existing ones

    // Create panels for database search phrases
    const dbPanels = searchPhrases.map((phrase, index) => {
      const key = `${phrase.host}:${phrase.searchPhrase}`;
      const existingPanel = existingPanelsMap.get(key);
      
      // If panel exists, update it; otherwise create new
      const panel = existingPanel ? {
        ...existingPanel,
        // Update the title to ensure it's current
        title: `${phrase.searchPhrase} (${phrase.host})`
      } : {
        id: Math.max(...existingPanels.map(p => p.id || 0), 0) + index + 1,
        title: `${phrase.searchPhrase} (${phrase.host})`,
        type: 'stat',
        targets: [{
          datasource: {
            type: 'cloudwatch',
            uid: 'cloudwatch'
          },
          namespace: 'Mula/SearchPhrases',
          metricName: 'SearchPhraseCount',
          dimensions: {
            Host: phrase.host,
            SearchPhrase: phrase.searchPhrase
          },
          statistic: 'Sum',
          period: '300',
          refId: String.fromCharCode(65 + index), // A, B, C, etc.
          region: 'us-east-1'
        }],
        gridPos: {
          h: 6,
          w: 6,
          x: (index % 4) * 6,
          y: startY + Math.floor(index / 4) * 6
        },
        options: {
          colorMode: 'value',
          graphMode: 'area',
          justifyMode: 'auto',
          orientation: 'auto',
          reduceOptions: {
            calcs: ['lastNotNull'],
            fields: '',
            values: false
          },
          textMode: 'auto'
        }
      };

      return panel;
    });

    // Merge existing panels with database panels
    const mergedPanels = [...existingPanels];
    
    // Update or add database panels
    dbPanels.forEach(dbPanel => {
      const key = `${dbPanel.targets[0].dimensions.Host}:${dbPanel.targets[0].dimensions.SearchPhrase}`;
      const existingIndex = mergedPanels.findIndex(p => {
        if (p.targets && p.targets[0] && p.targets[0].dimensions) {
          const host = p.targets[0].dimensions.Host;
          const searchPhrase = p.targets[0].dimensions.SearchPhrase;
          return host && searchPhrase && `${host}:${searchPhrase}` === key;
        }
        return false;
      });

      if (existingIndex >= 0) {
        // Update existing panel
        mergedPanels[existingIndex] = dbPanel;
        console.log(`🔄 Updated panel for: ${key}`);
      } else {
        // Add new panel
        mergedPanels.push(dbPanel);
        console.log(`➕ Added new panel for: ${key}`);
      }
    });

    console.log(`📊 Final panel count: ${mergedPanels.length} (${existingPanels.length} existing + ${dbPanels.length} database)`);

    // Update dashboard
    const updatedDashboard = {
      ...dashboard.dashboard,
      panels: mergedPanels,
      version: dashboard.dashboard.version + 1
    };

    const options = {
      hostname: 'g-e844782f82.grafana-workspace.us-east-1.amazonaws.com',
      port: 443,
      path: '/api/dashboards/db',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GRAFANA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Dashboard updated successfully!');
          console.log('📊 Updated panels:', mergedPanels.length);
          resolve(result);
        } catch (e) {
          reject(new Error('Error parsing update response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ dashboard: updatedDashboard }));
    req.end();
  });
}

function generateDashboardJson(searchPhrases) {
  // Start with the existing dashboard structure
  const existingDashboard = {
    "annotations": {
      "list": [
        {
          "builtIn": 1,
          "datasource": {
            "type": "grafana",
            "uid": "-- Grafana --"
          },
          "enable": true,
          "hide": true,
          "iconColor": "rgba(0, 211, 255, 1)",
          "name": "Annotations & Alerts",
          "type": "dashboard"
        }
      ]
    },
    "editable": true,
    "fiscalYearStartMonth": 0,
    "graphTooltip": 0,
    "id": 6,
    "links": [],
    "refresh": "30s",
    "schemaVersion": 39,
    "tags": [
      "mula",
      "search-phrases",
      "working"
    ],
    "templating": {
      "list": []
    },
    "time": {
      "from": "now-24h",
      "to": "now"
    },
    "timepicker": {},
    "timezone": "browser",
    "title": "Mula Search Phrases - Working Tiles",
    "uid": "aez8t5wxrwkqof",
    "version": 1,
    "weekStart": ""
  };

  // Create panels for each search phrase
  const panels = searchPhrases.map((phrase, index) => ({
    "datasource": {
      "type": "cloudwatch",
      "uid": "cloudwatch"
    },
    "fieldConfig": {
      "defaults": {
        "mappings": [],
        "thresholds": {
          "mode": "absolute",
          "steps": [
            {
              "color": "green",
              "value": null
            },
            {
              "color": "red",
              "value": 80
            }
          ]
        }
      },
      "overrides": []
    },
    "gridPos": {
      "h": 6,
      "w": 6,
      "x": (index % 4) * 6,
      "y": Math.floor(index / 4) * 6
    },
    "id": index + 1,
    "options": {
      "colorMode": "value",
      "graphMode": "area",
      "justifyMode": "auto",
      "orientation": "auto",
      "reduceOptions": {
        "calcs": [
          "lastNotNull"
        ],
        "fields": "",
        "values": false
      },
      "showPercentChange": false,
      "textMode": "auto",
      "wideLayout": true
    },
    "pluginVersion": "10.4.1",
    "targets": [
      {
        "datasource": {
          "type": "cloudwatch",
          "uid": "cloudwatch"
        },
        "dimensions": {
          "Host": phrase.host,
          "SearchPhrase": phrase.searchPhrase
        },
        "metricEditorMode": 0,
        "metricName": "SearchPhraseCount",
        "metricQueryType": 0,
        "namespace": "Mula/SearchPhrases",
        "period": "300",
        "refId": String.fromCharCode(65 + index),
        "region": "us-east-1",
        "statistic": "Sum"
      }
    ],
    "title": `${phrase.searchPhrase} (${phrase.host})`,
    "type": "stat"
  }));

  // Add the panels to the dashboard
  existingDashboard.panels = panels;

  return {
    dashboard: existingDashboard
  };
}

async function main() {
  try {
    console.log('🚀 Starting Grafana dashboard JSON generation from database...');

    // Get search phrases from database
    const searchPhrases = await getSearchPhrasesFromDB();
    
    if (searchPhrases.length === 0) {
      console.log('⚠️  No search phrases found in database');
      return;
    }

    // Generate dashboard JSON
    console.log('🔄 Generating dashboard JSON...');
    const dashboardJson = generateDashboardJson(searchPhrases);

    // Write JSON to file
    const fs = require('fs');
    const path = require('path');
    const outputFile = path.join(__dirname, 'grafana-dashboard.json');
    
    fs.writeFileSync(outputFile, JSON.stringify(dashboardJson, null, 2));
    
    console.log('🎉 Dashboard JSON generated successfully!');
    console.log(`📁 JSON written to: ${outputFile}`);
    console.log('📋 Copy the contents of this file and paste it into Grafana JSON Model');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getSearchPhrasesFromDB, updateDashboard };

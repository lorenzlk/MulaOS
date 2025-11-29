#!/bin/bash

# Deploy Real-Time Traffic Dashboard
# This script can deploy either a Grafana or CloudWatch dashboard

set -e

DASHBOARD_TYPE=${1:-"grafana"}
DASHBOARD_NAME="Mula-RealTime-Traffic"

echo "Deploying $DASHBOARD_TYPE dashboard: $DASHBOARD_NAME"

if [ "$DASHBOARD_TYPE" = "grafana" ]; then
    echo "Deploying Grafana dashboard..."
    
    # Check if import-grafana-dashboard.js exists
    if [ -f "import-grafana-dashboard.js" ]; then
        echo "Using existing Grafana import script..."
        node import-grafana-dashboard.js grafana-dashboard-realtime-traffic.json
    else
        echo "Grafana import script not found. Please ensure import-grafana-dashboard.js exists."
        echo "You can also manually import grafana-dashboard-realtime-traffic.json into Grafana."
        exit 1
    fi
    
elif [ "$DASHBOARD_TYPE" = "cloudwatch" ]; then
    echo "Deploying CloudWatch dashboard..."
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        echo "AWS CLI not found. Please install AWS CLI first."
        exit 1
    fi
    
    # Deploy CloudWatch dashboard
    aws cloudwatch put-dashboard \
        --dashboard-name "$DASHBOARD_NAME" \
        --dashboard-body file://cloudwatch-realtime-traffic-dashboard.json \
        --region us-east-1
    
    echo "CloudWatch dashboard deployed successfully!"
    echo "View at: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=$DASHBOARD_NAME"
    
else
    echo "Invalid dashboard type. Use 'grafana' or 'cloudwatch'"
    echo "Usage: $0 [grafana|cloudwatch]"
    exit 1
fi

echo "Dashboard deployment complete!"


# Release Notes: Customization & Automation System

**Release Date:** October 1, 2025  
**Versions:** www.makemula.ai v2.26.0, sdk.makemula.ai v1.38.3

## 🎯 Overview

This release introduces a comprehensive customization system that adapts the Mula widget experience based on user behavior, plus automated daily content refresh capabilities. The system intelligently shuffles product feeds for returning users while maintaining quality recommendations for new visitors.

## ✨ New Features

### Smart Product Customization
- **Intelligent Feed Shuffling**: Users who have seen the Mula widget multiple times now receive shuffled product feeds instead of always seeing the same popular items
- **Session Tracking**: `__mula_spv` cookie tracks page views per browser session
- **Widget Visibility Tracking**: `__mula_ivc` cookie (7-day expiration) tracks when users actually see the widget in view
- **Smart Algorithm**: Maintains 80/20 split - 80% popularity-based for new users, 20% random for variety

### Next Page Article Tracking
- **Visit Memory**: `__mula_npv` cookie (2-day expiration) remembers which next-page articles users have clicked
- **Smart Filtering**: Prevents showing already-visited articles in next-page recommendations
- **Efficient Storage**: Uses compact base36 hashing to minimize cookie size
- **Seamless Integration**: Works automatically with existing next-page recommendation system

### Automated Content Refresh
- **Daily Manifest Updates**: New cron job automatically rebuilds next-page manifests for all active publishers
- **Smart Domain Discovery**: Uses `SiteTargeting` table to identify active Mula installations
- **Safe Testing**: Dry-run mode allows testing without affecting production manifests
- **Robust Error Handling**: Comprehensive logging and graceful failure handling

## 🔧 Technical Improvements

### Code Quality & Maintainability
- **Centralized Helpers**: Created `Cookies.js` and `HashHelpers.js` modules to eliminate code duplication
- **Consistent Cookie Management**: All Mula cookies now use proper domain scoping and `sameSite` attributes
- **Event Handling**: Fixed race conditions in next-page click tracking by moving event listeners directly into components

### Performance & Reliability
- **Eliminated Race Conditions**: Removed 100ms timeout dependencies in event handling
- **Better Error Recovery**: Improved error handling patterns across the custommization system
- **Optimized Cookie Usage**: Reduced cookie duplication and improved domain consistency

## 🚀 Production Deployment

### Automated Systems
- **Cron Integration**: Daily manifest refresh script ready for production scheduling
- **Database Integration**: Uses production `SiteTargeting` table for accurate domain discovery
- **S3 Integration**: Automated manifest uploads with proper error handling and monitoring

### Monitoring & Observability
- **Comprehensive Logging**: Detailed logs for debugging and monitoring
- **Dry-Run Capability**: Safe testing environment with full JSON output for inspection
- **Error Reporting**: Graceful handling of edge cases and failures

## 📊 Impact

### User Experience
- **Customized Feeds**: Returning users see fresh, varied product recommendations
- **Reduced Repetition**: Next-page articles won't repeat previously visited content
- **Maintained Quality**: New users still see the most popular, relevant products

### Operational Benefits
- **Automated Maintenance**: Daily content refresh reduces manual intervention
- **Improved Reliability**: Better error handling and monitoring capabilities
- **Code Maintainability**: Centralized helpers make future updates easier

## 🔄 Migration Notes

### Cookie Changes
- New cookies (`__mula_spv`, `__mula_ivc`, `__mula_npv`) are automatically created
- Existing cookies (`__mula_s`, `__mula_u`) maintain backward compatibility
- All cookies now use consistent domain scoping for better cross-subdomain functionality

# Project Brief: Mula

## Project Overview
Mula is an Agentic Operating System for Publisher Monetization that empowers publishers to fight AI disruption with AI, enabling them to extend user sessions and grow revenue per session (RPS) through intelligent product recommendations and content engagement.

## Core Mission
Transform publisher websites into high-performing, revenue-generating platforms by addressing the industry crisis of declining traffic and unreliable programmatic advertising through AI-powered monetization solutions.

## Key Requirements

### Performance Requirements
- SDK must remain incredibly lightweight (< 20 kB gzipped)
- Minimal impact on Core Web Vitals
- High availability and throughput for CDN assets
- Efficient event collection and processing

### Functional Requirements
1. **Product Recommendations**: Smart product feeds with reinforcement learning optimization
2. **Content Engagement**: Scroll tracking, view tracking, and user behavior analytics
3. **Publisher Integration**: Easy-to-install SDK for publisher websites
4. **Analytics & Reporting**: Comprehensive data collection and analysis pipeline
5. **Performance Monitoring**: Core Web Vitals impact measurement
6. **Multi-platform Product Search and Approval**: Support for multi-platform product search and approval
7. **Human-in-the-loop Feedback and Approval**: Human-in-the-loop feedback and approval for every page-search relationship

### Technical Requirements
- Client-side JavaScript SDK (Svelte-based)
- Cloud infrastructure (AWS) with CDN optimization
- Real-time event collection and processing
- Data analytics and reporting capabilities
- Publisher portal and management interface

## Success Metrics
- Revenue per session (RPS) improvement for publishers
- User session extension and engagement
- Publisher adoption and retention
- Revenue impact and RPM lift
- Core Web Vitals maintenance
- Event collection accuracy and completeness
- System uptime and performance
- Approval rate, feedback loop efficiency, and S3 path collision rate

## Project Scope
This is a monorepo containing:
1. **cloud.makemula.ai** - AWS infrastructure and CDN management
2. **sdk.makemula.ai** - Publisher-installable client-side SDK
3. **www.makemula.ai** - Product marketing site and backend services
4. **mobile-listicle-prototype** - UX prototypes and inspiration
5. **simulators** - Core Web Vitals impact measurement tools

## Current State
- SDK is functional with Svelte-based components
- Cloud infrastructure is operational with CDN and logging endpoints
- Backend services are running with product "mula-ization" capabilities
- Reinforcement learning pipeline is planned (MULA-1)
- Multiple publisher integrations exist with custom styling

## Future Vision
- Reinforcement learning optimization for product feeds
- Enhanced analytics and reporting capabilities
- Expanded publisher integrations
- Advanced performance optimization features 
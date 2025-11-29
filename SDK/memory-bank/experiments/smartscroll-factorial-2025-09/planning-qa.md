# Planning Q&A: SmartScroll 2x2 Factorial A/B Test

## Questions for Planning

### 1. RevContent Integration Details

**Q: Do we have the actual RevContent widget ID for on3.com?**

A: Yes, its 287645.

**Q: Should RevContent widgets replace Mula widgets entirely, or run alongside?**

A: They should run every 3rd product card. There is already logic in SmartScroll to inject an arbitrary ad tag every 3rd product card.

**Q: What's the RevContent reporting API/process for revenue data?**

A: Look at `./monetization/revcontent/reporting.md` for API specs.

### 2. Layout Implementation

**Q: Should the new vertical layout be a complete redesign or incremental changes?**

A: I think it should be incremental, but I'd like you to scan SmartScroll, look at the code, cross reference with the design image I provided and offer a recommendation.

**Q: Any specific responsive behavior requirements?**

A: The existing SmartScroll implementation is already responsive so we'd like to preserve that.

**Q: How should we handle the transition between layouts?**

A: Can you clarify what you mean by this?

### 3. Traffic Allocation

**Q: Equal 25% split across all 4 variants?**

A: Yes.

**Q: Any considerations for statistical power requirements?**

A: We are looking for big effects. Look at `./mde-assumptions.md` for the MDE experiment details and assumptions.

**Q: Minimum sample size targets?**

A: We are looking for big effects. Look at `./mde-assumptions.md` for the MDE experiment details and assumptions.

### 4. Revenue Attribution

**Q: How do we handle sessions that might have both Mula and RevContent interactions?**

A: We want to measure interaction effects & report on the KPIs for the combined treatment variant as well as the single-change variants.

**Q: What's the time window for revenue attribution?**

A: 30 days.

**Q: Any specific subId2 parameter format requirements for Impact?**

A: I think its a string max length 255 characters, but please check the impact docs to confirm.

### 5. Testing Strategy

**Q: How do we test RevContent integration in development?**

A: We will get production API keys for the reporting API so we can confirm connectivity. The JS snippet _should_ work so we can see the unit loading in-browser, but you never know with these kinds of things, there might be domain restrictions or something. We can roll out new canary build of the SDK code to production and test directly using the mulaQaVersion query string parameter on on3.com before flipping the switch to go-live to more traffic.

**Q: Query string overrides for all 4 variants?**

A: Yes, please.

**Q: Staging environment considerations?**

A: We can use the mulaQaVersion query string parameter to test the new integration.

# MDE Assumptions: SmartScroll 2x2 Factorial A/B Test

Here's a clean summary of the **MDE expectations** we worked out for your test plans:

---

## Baseline scale

* ~**35,000 viewable impressions/day** (expanded RevContent publisher network)
* ~**126 clicks/day total** ⇒ ~**0.36% CTR** baseline
* Split evenly into 4 cells for factorial ⇒ ~**8,750 impressions/day per cell**

---

## A/B test (one variant vs. control)

* **MDE = +20%** (CTR from 0.36% → 0.43% or RPM equivalent)
* **80% power, α=0.05**
* **Sample needed:** ~42.7k impressions per arm
* **Runtime:** ~5 days total (with 8,750 impressions/arm/day)

---

## 2×2 factorial test

### Main effects (Revcontent, Design)

* **MDE = +20%**
* **Sample needed:** ~42.7k impressions per cell
* **Runtime:** ~5–6 days (with 8,750 impressions/cell/day)

### Interaction effect (Rev×Design)

* With **MDE = +20%**, runtime is **~5–6 days**.
* If the true interaction is smaller (e.g., +10%), time grows ~quadratically ⇒ ~2–3 weeks.

---

## Practical alignment

* **Single A/B:** ~5 days for +20% lift.
* **Factorial (main + interaction):** Plan for **1 week** to confidently detect +20% lifts.
* Smaller lifts (<20%) require disproportionately longer run times (e.g., ~2–3 weeks for +10%).

---

## Test Plan Expectations Summary

This document provides the statistical foundation for the SmartScroll 2x2 factorial A/B test, including:

- **Traffic assumptions**: 35,000 daily impressions across RevContent publisher network
- **MDE targets**: 20% lift detection with 80% power
- **Runtime expectations**: 1 week for full factorial analysis
- **Sample size requirements**: ~42.7k impressions per cell

These assumptions inform the experiment design, implementation timeline, and success criteria outlined in the other experiment documentation.

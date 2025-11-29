# RevContent Tiles Integration Feature

## Overview

This feature integrates RevContent sponsored content tiles into the SmartScroll widget, displaying them every 5th card position. The integration uses the RevContent Trends API to fetch content and renders cards that match the existing product card design with a "Sponsored" badge.

## Feature Requirements

### Targeting
- **All brit.co pages**: Show RevContent tiles on all pages
- **All twsn pages**: Show RevContent tiles on all pages  
- **on3.com specific sections**: Only show on LSU and NC State team pages
  - URL pattern: `/teams/lsu-tigers` or `/teams/nc-state-wolfpack`

### Placement
- RevContent tiles appear every 5th card in the SmartScroll feed
- Cards match product card design with "Sponsored" badge in upper right of image
- Uses same viewability tracking system as product cards

### Analytics Requirements
- **Viewable Impressions**: Must distinguish between product cards and RevContent cards
  - Track card type (`product` vs `revcontent`)
  - Track product ID (for products) or RevContent UID (for RevContent cards)
  - Include type and ID/UID as parameters in tracking calls
- **Clicks**: Separate event name for RevContent clicks
  - Product clicks: `mula_store_click` (existing)
  - RevContent clicks: `mula_rev_content_click` (new)

## Architecture

### Targeting Function Pattern
Targeting logic is implemented as a generic function in each publisher's `index.js` file:

```javascript
// In pub-specific index.js (e.g., brit.co/index.js, on3.com/index.js)
window.Mula.shouldShowRevContent = () => {
  // Publisher-specific targeting logic
  // Return true if RevContent should be shown, false otherwise
};
```

### Publisher Configurations

#### brit.co
- Show on all pages
- Function: Always return `true`

#### twsn
- Show on all pages
- Function: Always return `true`

#### on3.com
- Show only on LSU and NC State team pages
- Function: Check URL pathname for `/teams/lsu-tigers` or `/teams/nc-state-wolfpack`

### RevContent API Integration

**API Endpoint**: `https://trends.revcontent.com/api/v2/`

**Parameters**:
- `api_key`: `ea00ee4c22a6e02d37b073e27c679fef49f780b7`
- `pub_id`: From `window.Mula.revContent.pubId`
- `widget_id`: From `window.Mula.revContent.widgetId`
- `domain`: Current page domain
- `sponsored_count`: `6`
- `img_w`: `400`
- `img_h`: `315`
- `width`: `1280`
- `send_view`: `true`
- `format`: `JSON`

**Response Structure**:
```json
{
  "content": [
    {
      "headline": "Article headline",
      "url": "RevContent tracking URL",
      "image": "Image URL",
      "brand": "Brand name",
      "type": "sponsored",
      "uid": "sponsored_14092051",
      "target_url": "Final destination URL",
      "impression": ""
    }
  ],
  "impression_uuid": "...",
  "view": "..."
}
```

### Card Rendering

RevContent cards match product card structure with these differences:
- **Sponsored Badge**: Display "Sponsored" in upper right corner of image
- **No Price/Rating**: RevContent cards don't show price or rating information
- **Brand Header**: Show brand name in card header (similar to product source)
- **Click Tracking**: Use `mula_rev_content_click` event with RevContent UID

### Feed Iterator Integration

The `FeedIterator` class in SmartScroll will be extended to:
1. Check `window.Mula.shouldShowRevContent()` before injecting RevContent
2. Inject RevContent cards every 5th position (positions 5, 10, 15, etc.)
3. Track RevContent items separately from products
4. Rotate through fetched RevContent items

## Implementation Details

### ViewTracker Enhancement

The existing `createProductCardViewTracker` will be enhanced to support card types:

```javascript
// Card elements must have data attributes:
// - data-card-type: "product" or "revcontent"
// - data-product-id: Product ID (for products)
// - data-revcontent-uid: RevContent UID (for RevContent cards)

// Tracking will include:
// - card_type: "product" | "revcontent"
// - product_id: (for products)
// - revcontent_uid: (for RevContent cards)
```

### SmartScroll Component Changes

1. **RevContent Fetching**:
   - Fetch RevContent content on SmartScroll initialization
   - Cache results to avoid repeated API calls
   - Handle API errors gracefully (fallback to product-only feed)

2. **Feed Iterator Enhancement**:
   - Add `revcontent` item type to pattern
   - Check `window.Mula.shouldShowRevContent()` before injecting
   - Inject every 5th position when enabled

3. **Card Rendering**:
   - Create `renderRevContentCard()` function
   - Match product card HTML structure
   - Add "Sponsored" badge styling
   - Set appropriate data attributes for tracking

4. **Click Handling**:
   - Track clicks with `mula_rev_content_click` event
   - Include RevContent UID in event metadata
   - Open `target_url` in new tab

### Styling

**Sponsored Badge**:
- Position: Upper right corner of card image
- Style: Similar to existing `.mula-tag` but with "Sponsored" text
- Background: Semi-transparent overlay
- Text: White, bold, small font size

## Analytics Events

### View Events
- **Event Name**: `mula_product_view` (products) or `mula_revcontent_view` (RevContent)
- **Event Value**: Product ID or RevContent UID
- **Metadata**:
  - `card_type`: "product" | "revcontent"
  - `product_id`: (for products)
  - `revcontent_uid`: (for RevContent cards)
  - `widget`: "smartscroll"

### Click Events
- **Product Clicks**: `mula_store_click` (existing)
- **RevContent Clicks**: `mula_rev_content_click` (new)
- **Event Value**: Product ID or RevContent UID
- **Metadata**: Same as view events

## Publisher Configuration Files

### brit.co/index.js
```javascript
window.Mula.shouldShowRevContent = () => {
  return true; // Show on all pages
};
```

### twsn/index.js (or similar)
```javascript
window.Mula.shouldShowRevContent = () => {
  return true; // Show on all pages
};
```

### on3.com/index.js
```javascript
window.Mula.shouldShowRevContent = () => {
  const pathname = window.location.pathname;
  return pathname.includes('/teams/lsu-tigers') || 
         pathname.includes('/teams/nc-state-wolfpack');
};
```

## Error Handling

- **API Failure**: Gracefully degrade to product-only feed
- **No RevContent Config**: Skip RevContent injection
- **Targeting Returns False**: Skip RevContent injection
- **Empty Content Array**: Skip RevContent injection

## Performance Considerations

- Fetch RevContent content once on SmartScroll initialization
- Cache API response to avoid repeated fetches
- Lazy load RevContent cards as they come into view
- Minimize impact on Core Web Vitals

## Testing Requirements

1. **Targeting Tests**:
   - Verify RevContent shows on all brit.co pages
   - Verify RevContent shows on all twsn pages
   - Verify RevContent shows only on LSU/NC State pages on on3.com
   - Verify RevContent doesn't show on other on3.com pages

2. **Placement Tests**:
   - Verify RevContent appears every 5th card
   - Verify correct rotation through RevContent items

3. **Analytics Tests**:
   - Verify view events include correct card type and ID/UID
   - Verify click events use `mula_rev_content_click` for RevContent
   - Verify product clicks still use `mula_store_click`

4. **Visual Tests**:
   - Verify "Sponsored" badge appears correctly
   - Verify card styling matches product cards
   - Verify responsive behavior

## Future Enhancements

- A/B testing different placement frequencies
- Performance optimization for RevContent API calls
- Additional targeting options
- Revenue attribution tracking


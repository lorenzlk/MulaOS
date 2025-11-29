window.Mula.jsonld = false;
window.Mula.amazonAssociatesId = 'on3m-20';
window.Mula.nextPage = true;
// RevContent configuration for on3.com
window.Mula.revContent = {
  pubId: '198204',
  widgetId: '288481'
};

// RevContent targeting: Show only on LSU and NC State team pages
window.Mula.shouldShowRevContent = () => {
  const pathname = window.location.pathname;
  return pathname.includes('/teams/lsu-tigers') || 
         pathname.includes('/teams/nc-state-wolfpack');
};

window.Mula.slots = {
  'slotB': (element) => {
    // Structure: article > div (admin) > header > div (container) > div (body) > a (separator)
    // We want to insert at article level, after the container div, before the separator anchor
    const articleContainer = document.querySelector("#article-1");
    if(articleContainer) {
      // Find the header to establish we're past the admin div
      const header = articleContainer.querySelector('header');
      if(header) {
        // Find the div container after the header (sibling to header)
        const containerDiv = header.nextElementSibling;
        if(containerDiv && containerDiv.tagName === 'DIV') {
          // Find the separator anchor that comes after the container div (sibling to container)
          const separatorAnchor = containerDiv.nextElementSibling;
          if(separatorAnchor && separatorAnchor.tagName === 'A') {
            // Insert before the separator anchor at the article level
            articleContainer.insertBefore(element, separatorAnchor);
          } else {
            // Fallback: insert after the container div if no separator found
            articleContainer.insertBefore(element, containerDiv.nextSibling);
          }
        }
      }
    }
  }
};

window.Mula.experiments = {
  'alpha': (widgets) => {
    window.Mula.slots['slotB'](widgets.smartScroll);
  }
};

window.Mula.auto = true;
window.Mula.organicConfig = {
  searchPhrases: [],
  targeting: () => {
    return true;
  },
  slots: {
    slotB: {
      smartScroll: 1
    }
  }
};

// Impact API subId3 configuration for team/section tracking
// Extracts team name from URL path like /teams/{team-name}/...
window.Mula.impact = window.Mula.impact || {};
window.Mula.impact.subid3 = (currentUrl) => {
  const pathMatch = currentUrl.pathname.match(/\/teams\/([^\/]+)/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1]; // e.g., "michigan-wolverines"
  }
  return null;
};

window.Mula.boot(); 
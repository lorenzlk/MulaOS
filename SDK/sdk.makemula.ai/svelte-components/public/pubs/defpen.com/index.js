window.Mula.SkimLinksId = '282345X1768683';
window.Mula.jsonld = true;
window.Mula.auto = true;
window.Mula.amazonAssociatesId = 'defpenm-20';
// RevContent configuration for defpen.com
window.Mula.revContent = {
  pubId: '198204',
  widgetId: '288483'
};
window.Mula.adTag = {
  class: 'mula-gpt-ad'
};
window.Mula.slots = {
  'slotA': (element) => {
    const carouselPlacement =
      document.querySelectorAll(".post-main")[0].querySelectorAll("p")[1];
    if(carouselPlacement) {
      carouselPlacement.parentNode.insertBefore(element, carouselPlacement.nextSibling);
    }
  },
  'slotB': (element) => {
    const afterContent = document.querySelectorAll('.entry-content')[0];
    if(afterContent) {
      afterContent.parentNode.insertBefore(element, afterContent.nextSibling);
    }
  }
};

window.Mula.experiments = {
  'alpha': (widgets) => {
    window.Mula.slots['slotA'](widgets.topShelf);
    window.Mula.slots['slotB'](widgets.smartScroll);
  }
};
window.Mula.organicConfig = {
  targeting: () => {
    return window.location.pathname !== "/";
  },
  ignorePageContext: true,
  searchPhrases: [
    "celebrity style essentials"
  ],
  slots: {
    slotB: {
      smartScroll: 1
    }
  }
};
(function() {
  // Step 1: Define variables globally (simulate inline <script>)
  window.site = window.Mula.currentUrl.hostname;
  window.pageurl = window.Mula.currentUrl.href;
  window.unit = 'defpen.com.dw.300x250';
  window.childnetworkid = '59967673';
  window.size = [300, 250];

  // Step 2: Create and inject the external script (owHCMR.js)
  var externalScript = document.createElement('script');
  externalScript.src = 'https://s3.amazonaws.com/script-tags/owHCMR.js';
  externalScript.async = true;

  // Step 3: Create and append the <div id="hcmprebid">
  var targetDiv = document.createElement('div');
  targetDiv.id = 'hcmprebid';
  document.body.appendChild(targetDiv); // Or insert elsewhere as needed

  // Step 4: After the external script loads, call loadcontent(unit)
  externalScript.onload = function() {
    if (typeof loadcontent === 'function') {
      window.Mula.adTag.adLoader = function() {
        loadcontent(window.unit);
      }
    } else {
      console.warn('loadcontent() is not defined after owHCMR.js loaded.');
    }
  };

  document.head.appendChild(externalScript);
})();

window.Mula.boot(); 
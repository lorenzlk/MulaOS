window.Mula.jsonld = false;
window.Mula.auto = true;
window.Mula.amazonAssociatesId = 'twsmm-20';

// RevContent configuration for twsn.net
// window.Mula.revContent = {
//   pubId: '198204',
//   widgetId: 'xxx' // TODO: Confirm correct widget ID for twsn.net
// };

// RevContent targeting: Show on all twsn.net pages
// window.Mula.shouldShowRevContent = () => {
//   return false;
// };

window.Mula.slots = {
  'slotA': (element) => {
    return;
  },
  'slotB': (element) => {    
    const afterContent = document.querySelectorAll('.sharedaddy.sd-sharing-enabled')[0].childNodes[0];
    if(afterContent) {
      afterContent.parentNode.insertBefore(element, afterContent.nextSibling);
    }
  }
};

window.Mula.organicConfig = {
  searchPhrases: [],
  slots: {
    slotB: {
      smartScroll: 1
    }
  }
};

window.Mula.boot(); 

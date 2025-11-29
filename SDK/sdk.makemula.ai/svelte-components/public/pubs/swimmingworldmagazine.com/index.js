//window.Mula.SkimLinksId = '';
// window.Mula.adTag = {};
window.Mula.amazonAssociatesId = 'swimworldm-20';
// RevContent configuration for swimmingworld.com
window.Mula.revContent = {
  pubId: '198204',
  widgetId: '288480'
};

window.Mula.slots = {
  'slotB': (element) => {
    var targetElement = document.querySelector('#wpdcom.wpdiscuz_unauth.wpd-default.wpd-layout-1.wpd-comments-open');
    if (targetElement) { 
        targetElement.parentNode.insertBefore(element, targetElement.nextSibling); 
    }
  }
};

window.Mula.experiments = {};

window.Mula.auto = true;
window.Mula.jsonld = false;

window.Mula.organicConfig = {
  targeting: () => {
    return true;
  },
  smartScroll: [
    {
      feedLength: 40,
    }
  ],
  slots: {
    slotB: {
      smartScroll: 1
    }
  }
};

window.Mula.boot(); 

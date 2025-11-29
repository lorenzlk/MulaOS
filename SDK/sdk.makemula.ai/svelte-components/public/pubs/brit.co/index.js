window.Mula.SkimLinksId = '58005X1352817';
window.Mula.amazonAssociatesId = 'britcom03-20';
window.Mula.adTag = {
  class: 'htlad-Mula_contentbanner'
}

// RevContent configuration for brit.co
window.Mula.revContent = {
  pubId: '198204',
  widgetId: '288479'
};

// RevContent targeting: Show on all brit.co pages
window.Mula.shouldShowRevContent = () => {
  return true;
};

window.Mula.slots = {
  'slotA': (element) => {
    const carouselPlacement =
      document.querySelectorAll(".body-description")[0]?.querySelectorAll("p")[1];
    if(carouselPlacement) {
      carouselPlacement.parentNode.insertBefore(element, carouselPlacement.nextSibling);
    }
  },
  'slotB': (element) => {
    let items = document.querySelectorAll(".main-column .rebellt-item");
    if(items.length === 0) {
      items = document.querySelectorAll(".item-block.impression");
    }
    const afterContent = items.length ? items[items.length - 1] : null;
    if(afterContent) {
      afterContent.parentNode.insertBefore(element, afterContent.nextSibling);
    }
  }
};

window.Mula.experiments = {
  'alpha': (widgets) => {
    window.Mula.slots['slotA'](widgets.topShelf);
    window.Mula.slots['slotB'](widgets.smartScroll);
  },
  'beta': (widgets) => {
    window.Mula.slots['slotA'](widgets.topShelf);
    window.Mula.slots['slotB'](widgets.smartScroll);
  }
};

window.Mula.auto = true;
window.Mula.jsonld = true;

window.Mula.organicConfig = {
  targeting: () => {
    const isMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      return mobileRegex.test(userAgent.toLowerCase());
    };
    return isMobile();
  },
  smartScroll: [
    {
      loadMoreButton: true,
      feedLength: 40,
    },
    {
      loadMoreButton: true,
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

// Impact stat tag
(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A6453261-eb15-49de-ac5c-cf66af163fc11.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression'); 
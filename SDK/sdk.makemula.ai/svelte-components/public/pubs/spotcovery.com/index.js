window.Mula.SkimLinksId = null; // No SkimLinks ID for spotcovery.com
window.Mula.jsonld = false;
window.Mula.adTag = {
  type: "gpt",
  slotId: "/22652287591/300x250",
  id: "div-gpt-ad-1746872854642-0"
};
window.Mula.auto = true;
window.Mula.slots = {
  'slotA': (element) => {
    const carouselPlacement =
      document.querySelectorAll('div.td-post-content div.bialty-container p:nth-of-type(2)')[0];
    if(carouselPlacement) {
      carouselPlacement.parentNode.insertBefore(element, carouselPlacement.nextSibling);
    }
  },
  'slotB': (element) => {
    const afterContent = document.querySelectorAll("div.td-post-content figure:last-of-type + p")[0];
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
  searchPhrases: [
    "wellness products for melanin-rich skin"
  ],
  slots: {
    slotB: {
      smartScroll: 1
    }
  }
};

window.Mula.boot(); 
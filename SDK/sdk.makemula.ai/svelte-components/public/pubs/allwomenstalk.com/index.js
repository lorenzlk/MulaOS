window.Mula.SkimLinksId = null;
window.Mula.adTag = null;

window.Mula.slots = {
  'slotA': (element) => {},
  'slotB': (element) => {
    const section = document.querySelector("section#content");
    if(section) {
        section.appendChild(element);
    }
  }
};

window.Mula.experiments = {};
window.Mula.jsonld = false;
window.Mula.auto = true;
window.Mula.organicConfig = {
  searchPhrases: [
    "trending beauty products"
  ],
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
      smartScroll: 9,
      holdout: 1
    }
  }
};

window.Mula.boot(); 
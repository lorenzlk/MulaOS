window.Mula.SkimLinksId = '155639X1621900';
window.Mula.jsonld = false;

window.Mula.slots = {
  'slotA': (element) => {
    const carouselPlacement =
      document.querySelectorAll('.entry-content')[0].querySelectorAll("p")[1];
    if(carouselPlacement) { 
      carouselPlacement.parentNode.insertBefore(element, carouselPlacement.nextSibling);
    }
  },
  'slotB': (element) => {
    const afterContent = document.querySelectorAll(".entry-content")[0];
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
    "executive travel gear"
  ],
  slots: {
    slotB: {
      smartScroll: 1
    }
  }
};
window.Mula.boot(); 
window.Mula.SkimLinksId = '10702X690944';
window.Mula.jsonld = false;
window.Mula.adTag = {
  type: 'gpt',
  slotId: '/11462305847,1026014/gadgetreview/mula',
  id: 'div-gpt-ad-1749076273313-0',
  class: 'mula-gpt-ad'
};

window.Mula.slots = {
  'slotA': (element) => {
    const carouselPlacement =
      document.querySelector("div.entry-content").querySelectorAll("p")[2];
    if(carouselPlacement) {
      carouselPlacement.parentNode.insertBefore(element, carouselPlacement.nextSibling);
    }
  },
  'slotB': (element) => {
    const afterContent = document.querySelector("div.entry-content");
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

window.Mula.boot(); 
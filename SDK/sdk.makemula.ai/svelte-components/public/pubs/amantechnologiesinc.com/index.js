window.Mula.auto = true;

window.Mula.slots = {
  'slotA': (element) => {
    const carouselPlacement =
      document.querySelectorAll("body h1")[0];
    if(carouselPlacement) {
      carouselPlacement.parentNode.insertBefore(element, carouselPlacement.nextSibling);
    }
  },
  'slotB': (element) => {
    const afterContent = document.querySelectorAll('body p')[0];
    if(afterContent) {
      afterContent.parentNode.insertBefore(element, afterContent.nextSibling);
    }
  }
};


window.Mula.organicConfig = {
  targeting: () => {
    return true;
  },
  slots: {
    slotA: {
      topShelf: 1
    },
    slotB: {
      smartScroll: 1
    }
  }
};

window.Mula.boot(); 
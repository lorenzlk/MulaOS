window.Mula.auto = true;
window.Mula.fallback = true;
window.Mula.slots = {
  'slotB': (element) => {
    const afterContent = document.querySelector(".recommended-posts");
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
    slotB: {
      smartScroll: 1
    }
  }
};

window.Mula.boot(); 

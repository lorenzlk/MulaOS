window.Mula.jsonld = false;
window.Mula.auto = false;
window.Mula.amazonAssociatesId = 'stylecasterm-20';

window.Mula.slots = {
  'slotA': (element) => {
    const afterContent = document.querySelectorAll('[data-component="article-footer"]')[0].childNodes[0];
    if(afterContent) {
      afterContent.parentNode.insertBefore(element, afterContent.nextSibling);
    }
  },
  'slotB': (element) => {    
    const afterContent = document.querySelectorAll("div[data-template='article']")[0];
    if(afterContent) {
      afterContent.parentNode.insertBefore(element, afterContent.nextSibling);
    }
  }
};

window.Mula.experiments = {};

window.Mula.organicConfig = {
  searchPhrases: [],
  slots: {
    slotA: {
      topShelf: 1
    }
  }
};

window.Mula.boot(); 

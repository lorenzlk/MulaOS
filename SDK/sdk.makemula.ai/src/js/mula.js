window.MULA_VERSION = '{{version}}';
(() => {
  try {
    //Init check
    if(window.Mula && window.Mula.version) {
      // Use console.log here since window.Mula.log isn't available yet
      console.log("Mula already loaded, exiting...");
      return;
    }
    //Browser support checks
    let ck = window.document.cookie;
    const url = new URL(window.location.href);
    if(!url) {
      throw new Error("no URL support");
    }

    //initialize Mula
    window.Mula = Object.assign(window.Mula || {}, {
      version: '{{version}}',
      sdkEnvironment: '{{&SDK_ENVIRONMENT}}',
      logLevel: {{&LOG_LEVEL}}, //0 = none, 1 = info
      cdnHost: `{{&CDN_HOST}}`,
      sdkVersionRoot: () => {
        return `${Mula.cdnHost}/sdk/${Mula.version}`;
      }
    });
    window.Mula.version = url.searchParams.get("mulaQaVersion") || window.MULA_VERSION;
    const sdkJs = document.createElement('script');
    sdkJs.type = "module";
    sdkJs.src = `${Mula.sdkVersionRoot()}/js/mula-components.js`;
    const head = document.getElementsByTagName("head")[0];
    head.appendChild(sdkJs);
  } catch(e) {}
})();

import { BROWSER, DEV } from "esm-env";

let _log = () => {};
let _logEvent = () => {};
let _initLogger = () => {};
let _setGlobalEventData = () => {};
let _loggerParams = {};
let _globalEventData = {};
const _gtag = function () {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments);
}
if(BROWSER) {
    _log = (message, obj) => {
        if(window.Mula.logLevel > 0) {
            const timestamp = new Date().toISOString();
            const prefix = `%c[Mula ${timestamp}]%c`;
            const styles = [
                'background: #6366f1; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
                'color: #6366f1; font-weight: bold;'
            ];
            
            const args = [prefix, ...styles, message, obj].filter((x) => x);
            console.log(...args);
        }
    };
    _setGlobalEventData = (key, value) => {
      _globalEventData[key] = value;
    };
    _initLogger = (loggerParams = {}, globalEventData = {}) => {
      window.Mula.logLevel = loggerParams.logLevel || 0;
      window.Mula.fullStoryEnabled = loggerParams.fullStory || false;
      const fsAlreadyPresent = window.FS && typeof(window.FS) === 'function';
      if(!!window.Mula.fullStoryEnabled && !fsAlreadyPresent) {
        // FullStory disabled - can be re-enabled if needed
        // Previously loaded FullStory session recording script here
        _log("FullStory has been removed, skipping initialization");
      }
      _loggerParams = loggerParams;
      _globalEventData = globalEventData;
    };
    _logEvent = (eventName, eventValue, eventMeta = {}) => {
        let referringHost = "";
        try {
            referringHost = new URL(document.referrer).host;
        } catch(e) {}

        const loggedMeta = Object.assign(eventMeta, _globalEventData, {
            href: window.location.href,
            referringHost,
        });
        _log("logging event", {eventName, eventValue, loggedMeta});
        if (window.FS && typeof window.FS.event === 'function') {
            FS.event(eventName, loggedMeta);
        }

        if(eventName !== "page_view")
          _gtag('event', eventName, loggedMeta);

        try{
            const mulaEvent = btoa(JSON.stringify({
                eventName,
                eventValue,
                ...loggedMeta
            }));
            window.fetch(
                `https://beacon.makemula.ai/1x1.png?${mulaEvent}`,
                {
                    mode: 'no-cors'
                }
            );
        } catch(e) {}
    };
}

export const log = _log;
export const logEvent = _logEvent;
export const initLogger = _initLogger;
export const setGlobalEventData = _setGlobalEventData;

import { BROWSER, DEV } from "esm-env";
import { logEvent } from "./Logger.js";
import { getCookie, setCookie, getTopLevelDomain } from "./Cookies.js";
let _initTrackers = () => {};
let _startTrackers = () => {};
let sessionId = null;
let userId = null;
let startTime = null;
let maxScrollDepth = 0;

if(BROWSER) {


    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        
        // Fallback implementation for browsers that don't support crypto.randomUUID
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getOrCreateSessionId() {
        let sid = getCookie(SESSION_COOKIE);
        if (!sid) {
            sid = generateUUID();
            // No max-age: session cookie
            setCookie(SESSION_COOKIE, sid, { domain: COOKIE_DOMAIN, sameSite: 'lax' });
        }
        return sid;
    }

    function getOrCreateUserId() {
        let uid = getCookie(USER_COOKIE);
        if (!uid) {
            uid = generateUUID();
            setCookie(USER_COOKIE, uid, { maxAge: COOKIE_MAX_AGE, domain: COOKIE_DOMAIN, sameSite: 'lax' });
        }
        return uid;
    }

    function refreshUserCookie() {
        // Extend expiration on activity
        const uid = getCookie(USER_COOKIE);
        if (uid) {
            setCookie(USER_COOKIE, uid, { maxAge: COOKIE_MAX_AGE, domain: COOKIE_DOMAIN, sameSite: 'lax' });
        }
    }

    function getScrollPercent() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = docHeight === 0 ? 100 : Math.round((scrollTop / docHeight) * 100);
        return Math.min(100, percent);
    }
    let maxScrollDepth = 0;
    function onScroll() {
        const currentDepth = window.scrollY;
        if (currentDepth > maxScrollDepth) {
            maxScrollDepth = currentDepth;
            logEvent('scroll_depth_pixels', maxScrollDepth);
        }
    }

    function startHeartbeat() {
        setInterval(() => {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            logEvent('time_on_page', timeOnPage);
        }, HEARTBEAT_INTERVAL);
    }

    function isInMulaShadowDOM(el) {
        let root = el.getRootNode?.();
        if (root instanceof ShadowRoot) {
            const host = root.host;
            if (host && host.tagName.toLowerCase().startsWith('mula-')) {
                return true;
            }
        }
        return false;
    }

    function onClickCapture(e) {
        if (isInMulaShadowDOM(e.target)) return; // Ignore clicks inside mula-* shadow roots

        const el = e.target.closest('a, button, [role="button"], [onclick], input[type="submit"]');
        if (!el) return;

        const tag = el.tagName;
        const href = el.getAttribute('href') || null;
        if(href && href.indexOf(getTopLevelDomain()) === -1) {
            logEvent('click', href);
        }
    }

    const SESSION_COOKIE = '__mula_s';
    const USER_COOKIE = '__mula_u';
    const COOKIE_MAX_AGE = 60 * 60 * 24 * 730; // 2 years
    const HEARTBEAT_INTERVAL = 15000;
    const COOKIE_DOMAIN = getTopLevelDomain(); // e.g. ".example.com"
    
    _initTrackers = () => {
        sessionId = getOrCreateSessionId();
        userId = getOrCreateUserId();
        startTime = Date.now();
        maxScrollDepth = 0;
        return {
            sessionId,
            userId
        };
    };
    

    _startTrackers = () => {
        if(!sessionId || !userId) {
            throw new Error('Session or user ID not found');
        }
        window.addEventListener('beforeunload', function () {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            logEvent('time_on_page', timeOnPage);
        });

        let throttleTimeout;
        window.addEventListener('scroll', function () {
            if (!throttleTimeout) {
                throttleTimeout = setTimeout(() => {
                    onScroll();
                    throttleTimeout = null;
                }, 2500);
            }
        });
        window.addEventListener('click', onClickCapture, true);
        startHeartbeat();
    };
}
export const startTrackers = _startTrackers;
export const initTrackers = _initTrackers;
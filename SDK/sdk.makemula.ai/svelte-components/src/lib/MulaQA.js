import { createSHA256Hash } from './URLHelpers';
import { log } from './Logger.js';

let MulaQA;

if (typeof window !== 'undefined' && window.HTMLElement) {
  MulaQA = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.qaData = [];
      this.displayedQuestions = 0;
      this.loading = true;
      this.error = null;
      this.observer = null;
    }

    static get observedAttributes() {
      return ['page-url', 'cdn-url'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'page-url' && newValue !== oldValue) {
        this.loadQA(newValue, this.getAttribute('cdn-url'));
      }
    }

    async loadQA(page_url, cdn_url) {
      try {
        this.loading = true;
        this.render();

        cdn_url ||= import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT;
        const u = new URL(page_url);
        const hash = await createSHA256Hash(u.pathname);
        const qaUrl = `${cdn_url}/${u.hostname}/pages/${hash}/qa/index.json`;
        
        const response = await fetch(qaUrl);
        
        if (!response.ok) {
          if (u.hostname.startsWith("www")) {
            const altUrl = `${cdn_url}/${u.hostname.replace("www.", "")}/pages/${hash}/qa/index.json`;
            const altResponse = await fetch(altUrl);
            if (altResponse.ok) {
              const data = await altResponse.json();
              this.qaData = data.qa;
            } else {
              throw new Error('Failed to fetch Q&A data');
            }
          } else {
            throw new Error('Failed to fetch Q&A data');
          }
        } else {
          const data = await response.json();
          this.qaData = data.qa;
        }
        
        // Initialize with first 4 questions
        this.displayedQuestions = Math.min(4, this.qaData.length);
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
        this.render();
      }
    }

    connectedCallback() {
      const pageUrl = this.getAttribute('page-url');
      const cdnUrl = this.getAttribute('cdn-url');
      if (pageUrl) {
        this.loadQA(pageUrl, cdnUrl);
      }

      // Set up intersection observer for viewport tracking
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            log('mula_in_view', 'mula-qa');
            this.observer.disconnect(); // Only log once when first visible
          }
        });
      }, { threshold: 0.5 });

      this.observer.observe(this);
    }

    disconnectedCallback() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }

    loadMoreQuestions() {
      const newCount = Math.min(this.displayedQuestions + 2, this.qaData.length);
      if (newCount > this.displayedQuestions) {
        const container = this.shadowRoot.querySelector('.qa-container');
        // Only create and append new questions
        this.qaData.slice(this.displayedQuestions, newCount).forEach((item, index) => {
          const qaItem = document.createElement('div');
          qaItem.className = 'qa-item';

          const questionDiv = document.createElement('div');
          questionDiv.className = 'question';
          questionDiv.dataset.index = this.displayedQuestions + index;

          const questionText = document.createElement('span');
          questionText.textContent = item.q;

          const arrow = document.createElement('div');
          arrow.className = 'arrow';

          const answerDiv = document.createElement('div');
          answerDiv.className = 'answer';
          answerDiv.textContent = item.a;

          questionDiv.appendChild(questionText);
          questionDiv.appendChild(arrow);
          qaItem.appendChild(questionDiv);
          qaItem.appendChild(answerDiv);
          container.appendChild(qaItem);

          // Add click handler
          questionDiv.addEventListener('click', () => {
            answerDiv.classList.toggle('expanded');
            arrow.classList.toggle('expanded');
            log('mula_click', 'mula-qa');
            this.loadMoreQuestions();
          });
        });
        
        this.displayedQuestions = newCount;
      }
    }

    render() {
      const style = `
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 100%;
        }
        
        .qa-container {
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          padding: 16px;
          background: white;
        }
        
        .qa-item {
          border-bottom: 1px solid #e1e1e1;
          padding: 12px 0;
        }
        
        .qa-item:last-child {
          border-bottom: none;
        }
        
        .question {
          font-weight: 500;
          color: #1a0dab;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }
        
        .question:hover {
          text-decoration: underline;
        }
        
        .answer {
          color: #4d5156;
          padding: 8px 0;
          display: none;
        }
        
        .answer.expanded {
          display: block;
        }
        
        .arrow {
          width: 12px;
          height: 12px;
          border-right: 2px solid #1a0dab;
          border-bottom: 2px solid #1a0dab;
          transform: rotate(45deg);
          transition: transform 0.2s;
        }
        
        .arrow.expanded {
          transform: rotate(-135deg);
        }
        
        .loading {
          text-align: center;
          padding: 20px;
          color: #666;
        }
        
        .error {
          color: #d93025;
          padding: 20px;
          text-align: center;
        }
      `;

      // Clear the shadow root
      this.shadowRoot.innerHTML = '';

      // Create and append style element
      const styleElement = document.createElement('style');
      styleElement.textContent = style;
      this.shadowRoot.appendChild(styleElement);

      // Create container
      const container = document.createElement('div');
      container.className = 'qa-container';
      this.shadowRoot.appendChild(container);

      if (this.loading) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = 'Loading questions...';
        container.appendChild(loadingDiv);
      } else if (this.error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = this.error;
        container.appendChild(errorDiv);
      } else {
        // Create Q&A items
        this.qaData.slice(0, this.displayedQuestions).forEach((item, index) => {
          const qaItem = document.createElement('div');
          qaItem.className = 'qa-item';

          const questionDiv = document.createElement('div');
          questionDiv.className = 'question';
          questionDiv.dataset.index = index;

          const questionText = document.createElement('span');
          questionText.textContent = item.q;

          const arrow = document.createElement('div');
          arrow.className = 'arrow';

          const answerDiv = document.createElement('div');
          answerDiv.className = 'answer';
          answerDiv.textContent = item.a;

          questionDiv.appendChild(questionText);
          questionDiv.appendChild(arrow);
          qaItem.appendChild(questionDiv);
          qaItem.appendChild(answerDiv);
          container.appendChild(qaItem);

          // Add click handler
          questionDiv.addEventListener('click', () => {
            answerDiv.classList.toggle('expanded');
            arrow.classList.toggle('expanded');
            log('mula_click', 'mula-qa');
            this.loadMoreQuestions();
          });
        });
      }
    }
  }
} else {
  MulaQA = class {
    constructor() {
      console.warn('MulaQA is being instantiated in a non-browser environment');
    }
  }
}

// Only define the custom element if we're in a browser environment
if (typeof window !== 'undefined' && window.HTMLElement) {
  customElements.define('mula-qa', MulaQA);
}

export default MulaQA; 
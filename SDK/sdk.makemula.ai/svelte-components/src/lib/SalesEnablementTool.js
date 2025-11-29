/**
 * Sales Enablement Placement Tool
 * 
 * This tool allows users to visually select placement locations for Mula widgets
 * (TopShelf or SmartScroll) by hovering over page elements and clicking to insert.
 */

import { log } from './Logger.js';

class SalesEnablementTool {
  constructor() {
    this.isActive = false;
    this.hoveredElement = null;
    this.selectedWidget = null;
    this.overlay = null;
    this.widgetSelector = null;
    this.insertedWidgets = [];
    
    // Bind methods to preserve context
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleWidgetSelect = this.handleWidgetSelect.bind(this);
    this.handleHide = this.handleHide.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  /**
   * Initialize the sales enablement tool
   */
  init() {
    if (this.isActive) {
      console.warn('Sales Enablement Tool is already active');
      return;
    }

    this.isActive = true;
    this.createOverlay();
    this.createWidgetSelector();
    this.attachEventListeners();
    
    log('Sales Enablement Tool activated');
  }

  /**
   * Create the overlay that will show hover effects
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'mula-sales-enablement-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999999;
    `;
    document.body.appendChild(this.overlay);
  }

  /**
   * Create the widget selector UI
   */
  createWidgetSelector() {
    this.widgetSelector = document.createElement('div');
    this.widgetSelector.id = 'mula-widget-selector';
    this.widgetSelector.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 2px solid #007bff;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 200px;
    `;

    this.widgetSelector.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #333;">
        Mula Widget Placement Tool
      </div>
      <div style="margin-bottom: 15px; font-size: 14px; color: #666;">
        Select a widget type, then click on any element to insert it.
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 14px;">
          <input type="radio" name="widgetType" value="topshelf" style="margin-right: 8px;">
          TopShelf Widget
        </label>
        <label style="display: block; margin-bottom: 5px; font-size: 14px;">
          <input type="radio" name="widgetType" value="smartscroll" style="margin-right: 8px;">
          SmartScroll Widget
        </label>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button id="mula-hide-btn" style="
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">Hide Tool</button>
        <button id="mula-cancel-btn" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">Remove All</button>
      </div>
      <div id="mula-status" style="
        margin-top: 10px;
        font-size: 12px;
        color: #666;
        font-style: italic;
      ">Select a widget type to begin</div>
    `;

    document.body.appendChild(this.widgetSelector);

    // Add event listeners for the selector
    const radioButtons = this.widgetSelector.querySelectorAll('input[name="widgetType"]');
    radioButtons.forEach(radio => {
      radio.addEventListener('change', this.handleWidgetSelect);
    });

    const hideBtn = this.widgetSelector.querySelector('#mula-hide-btn');
    const cancelBtn = this.widgetSelector.querySelector('#mula-cancel-btn');
    
    hideBtn.addEventListener('click', this.handleHide);
    cancelBtn.addEventListener('click', this.handleCancel);
  }

  /**
   * Attach event listeners to the document
   */
  attachEventListeners() {
    document.addEventListener('mouseover', this.handleMouseOver, true);
    document.addEventListener('mouseout', this.handleMouseOut, true);
    document.addEventListener('click', this.handleClick, true);
  }

  /**
   * Handle mouse over events to highlight elements
   */
  handleMouseOver(event) {
    if (!this.isActive || !this.selectedWidget) return;

    const element = event.target;
    
    // Skip if hovering over our own UI elements
    if (element.closest('#mula-sales-enablement-overlay') || 
        element.closest('#mula-widget-selector')) {
      return;
    }

    this.hoveredElement = element;
    this.highlightElement(element);
  }

  /**
   * Handle mouse out events to remove highlighting
   */
  handleMouseOut(event) {
    if (!this.isActive) return;

    const element = event.target;
    
    // Skip if moving to our own UI elements
    if (event.relatedTarget && 
        (event.relatedTarget.closest('#mula-sales-enablement-overlay') || 
         event.relatedTarget.closest('#mula-widget-selector'))) {
      return;
    }

    this.removeHighlight();
    this.hoveredElement = null;
  }

  /**
   * Handle click events to insert widgets
   */
  handleClick(event) {
    if (!this.isActive || !this.selectedWidget || !this.hoveredElement) return;

    // Prevent the click from propagating
    event.preventDefault();
    event.stopPropagation();

    this.insertWidget(this.hoveredElement, this.selectedWidget);
  }

  /**
   * Handle widget type selection
   */
  handleWidgetSelect(event) {
    this.selectedWidget = event.target.value;
    
    const status = this.widgetSelector.querySelector('#mula-status');
    status.textContent = `Selected: ${this.selectedWidget === 'topshelf' ? 'TopShelf' : 'SmartScroll'} widget. Click on any element to insert.`;
  }



  /**
   * Handle hide button click
   */
  handleHide() {
    this.hide();
  }

  /**
   * Handle cancel button click
   */
  handleCancel() {
    this.destroy();
  }

  /**
   * Highlight an element to show it's selectable
   */
  highlightElement(element) {
    this.removeHighlight();

    const rect = element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.id = 'mula-highlight';
    highlight.style.cssText = `
      position: absolute;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 3px solid #007bff;
      background: rgba(0, 123, 255, 0.1);
      pointer-events: none;
      z-index: 999999;
      border-radius: 4px;
      transition: all 0.2s ease;
    `;

    this.overlay.appendChild(highlight);
  }

  /**
   * Remove the current highlight
   */
  removeHighlight() {
    const highlight = this.overlay.querySelector('#mula-highlight');
    if (highlight) {
      highlight.remove();
    }
  }

  /**
   * Insert a widget at the specified element location
   */
  insertWidget(targetElement, widgetType) {
    try {
      // Create a container for the widget
      const widgetContainer = document.createElement('div');
      
      // Inherit CSS classes from the target element for better styling integration
      const targetClasses = targetElement.className.split(' ').filter(cls => cls.trim() !== '');
      const inheritedClasses = targetClasses.join(' ');
      
      widgetContainer.className = `mula-widget-container mula-${widgetType}-container ${inheritedClasses}`;
      widgetContainer.style.cssText = `
        margin: 20px 0;
        padding: 10px;
        border: 2px dashed #007bff;
        border-radius: 8px;
        background: rgba(0, 123, 255, 0.05);
        position: relative;
        margin: 0 auto;
      `;

      // Add a label to show what widget was inserted
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        top: -10px;
        left: 10px;
        background: #007bff;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      `;
      label.textContent = `Mula ${widgetType === 'topshelf' ? 'TopShelf' : 'SmartScroll'}`;
      widgetContainer.appendChild(label);

      // Create the widget element using proper custom elements
      const widgetElement = document.createElement(`mula-${widgetType}`);
      widgetElement.id = `mula-${widgetType}-${Date.now()}`;
      widgetElement.className = `mula-${widgetType}-widget`;
      widgetContainer.appendChild(widgetElement);

      // Insert the widget after the target element
      targetElement.parentNode.insertBefore(widgetContainer, targetElement.nextSibling);

      // Store reference to inserted widget
      this.insertedWidgets.push({
        container: widgetContainer,
        widgetType: widgetType,
        targetElement: targetElement
      });

      // Update status
      const status = this.widgetSelector.querySelector('#mula-status');
      status.textContent = `${widgetType === 'topshelf' ? 'TopShelf' : 'SmartScroll'} widget inserted!`;

      // Call window.Mula.boot() to fetch products
      if (window.Mula && typeof window.Mula.boot === 'function') {
        window.Mula.boot();
        log(`Mula.boot() called after inserting ${widgetType} widget`);
      } else {
        log('window.Mula.boot() not available');
      }

      // Reset selection for next insertion
      this.selectedWidget = null;
      const radioButtons = this.widgetSelector.querySelectorAll('input[name="widgetType"]');
      radioButtons.forEach(radio => radio.checked = false);
      
      status.textContent = 'Widget inserted! Select another widget type to continue.';

    } catch (error) {
      log('Error inserting widget:', error);
      alert('Error inserting widget. Please try again.');
    }
  }

  /**
   * Hide the tool UI but keep inserted widgets
   */
  hide() {
    this.isActive = false;
    this.removeHighlight();

    // Remove borders and labels from inserted widgets but keep the widgets themselves
    this.insertedWidgets.forEach(widget => {
      if (widget.container) {
        // Remove the dashed border and background but keep inherited classes
        widget.container.style.border = 'none';
        widget.container.style.background = 'transparent';
        widget.container.style.padding = '0';
        widget.container.style.margin = '20px 0';
        
        // Remove the label
        const label = widget.container.querySelector('div[style*="position: absolute"]');
        if (label) {
          label.remove();
        }
        
        // Keep the inherited classes from the target element for proper styling
        // The mula-specific classes are preserved for identification
      }
    });

    // Remove event listeners
    document.removeEventListener('mouseover', this.handleMouseOver, true);
    document.removeEventListener('mouseout', this.handleMouseOut, true);
    document.removeEventListener('click', this.handleClick, true);

    // Remove UI elements
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this.widgetSelector && this.widgetSelector.parentNode) {
      this.widgetSelector.parentNode.removeChild(this.widgetSelector);
    }

    this.overlay = null;
    this.widgetSelector = null;
    this.hoveredElement = null;
    this.selectedWidget = null;

    log('Sales Enablement Tool hidden - widgets preserved');
  }

  /**
   * Remove all inserted widgets
   */
  removeInsertedWidgets() {
    this.insertedWidgets.forEach(widget => {
      if (widget.container && widget.container.parentNode) {
        widget.container.parentNode.removeChild(widget.container);
      }
    });
    this.insertedWidgets = [];
  }

  /**
   * Destroy the tool and clean up
   */
  destroy() {
    this.isActive = false;
    this.removeHighlight();
    this.removeInsertedWidgets();

    // Remove event listeners
    document.removeEventListener('mouseover', this.handleMouseOver, true);
    document.removeEventListener('mouseout', this.handleMouseOut, true);
    document.removeEventListener('click', this.handleClick, true);

    // Remove UI elements
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this.widgetSelector && this.widgetSelector.parentNode) {
      this.widgetSelector.parentNode.removeChild(this.widgetSelector);
    }

    this.overlay = null;
    this.widgetSelector = null;
    this.hoveredElement = null;
    this.selectedWidget = null;

    log('Sales Enablement Tool deactivated');
  }

  /**
   * Get the current status of the tool
   */
  getStatus() {
    return {
      isActive: this.isActive,
      selectedWidget: this.selectedWidget,
      insertedWidgetsCount: this.insertedWidgets.length,
      insertedWidgets: this.insertedWidgets.map(w => ({
        type: w.widgetType,
        target: w.targetElement.tagName
      }))
    };
  }
}

// Export for use in other modules
export default SalesEnablementTool; 
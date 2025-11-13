/**
 * Helper Functions for Widgets Field
 * 
 * These functions help validate and work with multiple widget selections
 */

function validateWidgets(widgetsString) {
  /**
   * Validates widget selection format
   * @param {string} widgetsString - Widget selection (e.g., "Smart-Scroll, Top-Shelf")
   * @return {boolean} True if valid format
   */
  if (!widgetsString || widgetsString.trim() === '') return true; // Empty is OK
  
  const validWidgets = ['Smart-Scroll', 'Top-Shelf'];
  const widgets = widgetsString.split(',').map(w => w.trim());
  
  // Check that all widgets are valid
  for (const widget of widgets) {
    if (!validWidgets.includes(widget)) {
      return false;
    }
  }
  
  // Check for duplicates
  const uniqueWidgets = [...new Set(widgets)];
  if (uniqueWidgets.length !== widgets.length) {
    return false; // Duplicates found
  }
  
  return true;
}

function getWidgetList(widgetsString) {
  /**
   * Converts widget string to array
   * @param {string} widgetsString - Widget selection
   * @return {Array} Array of widget names
   */
  if (!widgetsString || widgetsString.trim() === '') return [];
  return widgetsString.split(',').map(w => w.trim()).filter(w => w);
}

function hasWidget(widgetsString, widgetName) {
  /**
   * Checks if a specific widget is selected
   * @param {string} widgetsString - Widget selection
   * @param {string} widgetName - Widget to check for
   * @return {boolean} True if widget is included
   */
  if (!widgetsString) return false;
  const widgets = getWidgetList(widgetsString);
  return widgets.includes(widgetName);
}

function hasSmartScroll(widgetsString) {
  return hasWidget(widgetsString, 'Smart-Scroll');
}

function hasTopShelf(widgetsString) {
  return hasWidget(widgetsString, 'Top-Shelf');
}

function hasBothWidgets(widgetsString) {
  return hasSmartScroll(widgetsString) && hasTopShelf(widgetsString);
}


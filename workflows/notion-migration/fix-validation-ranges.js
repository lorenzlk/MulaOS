/**
 * Quick Fix Script: Update Data Validation Ranges
 * 
 * Run this function to fix data validation ranges after adding Website Domain column
 * This updates all validation dropdowns to the correct column positions
 */

function fixAccountValidationRanges() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Accounts');
  
  if (!sheet) {
    Logger.log('Accounts sheet not found');
    return;
  }
  
  // Clear all existing data validation first
  const dataRange = sheet.getRange('D2:I1000');
  dataRange.clearDataValidations();
  
  // Column mapping after adding Website Domain:
  // A=ID, B=Account Name, C=Website Domain, D=Type, E=Segment, F=Stage, G=Widgets, H=Platform, I=KVP Enabled
  
  // Type validation (Column D)
  const typeRange = sheet.getRange('D2:D1000');
  const typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Publisher', 'Channel', 'Demand', 'Data', 'LLM Chat App'], true)
    .build();
  typeRange.setDataValidation(typeRule);
  
  // Segment validation (Column E)
  const segmentRange = sheet.getRange('E2:E1000');
  const segmentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Tier 1', 'Tier 2', 'Tier 3'], true)
    .build();
  segmentRange.setDataValidation(segmentRule);
  
  // Stage validation (Column F)
  const stageRange = sheet.getRange('F2:F1000');
  const stageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pilot Live', 'Live', 'Onboarding', 'GTM', 'Paused', 'Signed', 'N/A'], true)
    .build();
  stageRange.setDataValidation(stageRule);
  
  // Widgets validation (Column G)
  const widgetsRange = sheet.getRange('G2:G1000');
  const widgetsRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Smart-Scroll', 'Top-Shelf', 'Smart-Scroll, Top-Shelf', 'Top-Shelf, Smart-Scroll'], true)
    .setAllowInvalid(false)
    .setHelpText('Select one or both widgets. For both, use: "Smart-Scroll, Top-Shelf"')
    .build();
  widgetsRange.setDataValidation(widgetsRule);
  
  // Platform validation (Column H)
  const platformRange = sheet.getRange('H2:H1000');
  const platformRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Desktop', 'Mobile', 'Desktop, Mobile', 'Mobile, Desktop'], true)
    .setAllowInvalid(false)
    .setHelpText('Select one or both platforms. For both, use: "Desktop, Mobile"')
    .build();
  platformRange.setDataValidation(platformRule);
  
  // KVP Enabled validation (Column I)
  const kvpRange = sheet.getRange('I2:I1000');
  const kvpRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Yes', 'No', 'NA'], true)
    .build();
  kvpRange.setDataValidation(kvpRule);
  
  Logger.log('Data validation ranges fixed!');
  SpreadsheetApp.getUi().alert('Data validation ranges have been updated successfully!');
}


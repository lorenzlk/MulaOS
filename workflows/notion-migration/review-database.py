#!/usr/bin/env python3
"""
Review Database Structure
Reads the Excel file and generates a visual report of the database structure.
"""

import sys
import os

try:
    import pandas as pd
    import openpyxl
except ImportError:
    print("Installing required packages...")
    os.system("pip install pandas openpyxl")
    import pandas as pd
    import openpyxl

def review_database(excel_path):
    """Review the database structure from Excel file."""
    
    if not os.path.exists(excel_path):
        print(f"Error: File not found: {excel_path}")
        return
    
    print("=" * 80)
    print("MULAOS DATABASE STRUCTURE REVIEW")
    print("=" * 80)
    print()
    
    # Read Excel file
    excel_file = pd.ExcelFile(excel_path)
    
    print(f"📊 Spreadsheet: {excel_path}")
    print(f"📑 Sheets found: {len(excel_file.sheet_names)}")
    print()
    
    # Review each sheet
    for sheet_name in excel_file.sheet_names:
        print("-" * 80)
        print(f"📋 SHEET: {sheet_name}")
        print("-" * 80)
        
        df = pd.read_excel(excel_path, sheet_name=sheet_name)
        
        print(f"   Columns: {len(df.columns)}")
        print(f"   Rows (including header): {len(df) + 1}")
        print()
        
        print("   Column Structure:")
        for i, col in enumerate(df.columns, 1):
            non_null = df[col].notna().sum()
            data_type = str(df[col].dtype)
            print(f"   {i:2d}. {col:30s} | Type: {data_type:15s} | Non-null: {non_null:4d}")
        
        print()
        
        # Show sample data if available
        if len(df) > 0:
            print("   Sample Data (first 3 rows):")
            print(df.head(3).to_string(index=False))
        else:
            print("   ⚠️  No data rows (only headers)")
        
        print()
        print()
    
    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total Sheets: {len(excel_file.sheet_names)}")
    
    total_columns = 0
    for sheet_name in excel_file.sheet_names:
        df = pd.read_excel(excel_path, sheet_name=sheet_name)
        total_columns += len(df.columns)
        print(f"  {sheet_name}: {len(df.columns)} columns")
    
    print(f"Total Columns: {total_columns}")
    print()
    
    # Expected vs Actual comparison
    print("EXPECTED STRUCTURE CHECK:")
    print("-" * 80)
    
    expected_sheets = {
        'Accounts': 15,
        'Contacts': 12,
        'Programs': 22,
        'Projects': 12,
        'Tasks': 15,
        'Activity Log': 10,
        'Lookups': 4
    }
    
    for sheet_name, expected_cols in expected_sheets.items():
        if sheet_name in excel_file.sheet_names:
            df = pd.read_excel(excel_path, sheet_name=sheet_name)
            actual_cols = len(df.columns)
            status = "✅" if actual_cols == expected_cols else "⚠️"
            print(f"{status} {sheet_name:20s} | Expected: {expected_cols:2d} | Actual: {actual_cols:2d}")
        else:
            print(f"❌ {sheet_name:20s} | Expected: {expected_cols:2d} | MISSING")

if __name__ == "__main__":
    excel_path = "MulaOS_Database.xlsx"
    
    if len(sys.argv) > 1:
        excel_path = sys.argv[1]
    
    review_database(excel_path)


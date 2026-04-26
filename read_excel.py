import pandas as pd
import sys
sys.stdout.reconfigure(encoding='utf-8')

file_path = r'C:\Users\HP\Downloads\Report5.3_System Test.xlsx'
df = pd.read_excel(file_path, sheet_name='UserWeb_Auth')

print("First 5 rows:")
for index, row in df.head(10).iterrows():
    print(f"Row {index}: {row.to_dict()}")

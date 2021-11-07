import json
import pandas as pd

df = pd.read_csv("../csvs/data_distinct.csv")

processed = [False] * df['stop_id'].count()
df['processed'] = processed

d = []

for index, row in df.iterrows():
    if row['processed']:
        continue

    x = {
        'stop_name': "", 
        'stop_id': "",
        'stop_desc': "",
        'route_id': []
    }

    stop = row['stop_id']

    x['stop_name'] = row['stop_name']
    x['stop_id'] = row['stop_id']
    x['stop_desc'] = row['stop_desc']
    x['route_id'].append(row['route_id'])

    for index2, row2 in df.iterrows():
        if row2['processed'] or (row2['stop_id'] != stop) or (index == index2):
            continue
        else:
            x['route_id'].append(row2['route_id'])
            row2['processed'] = True

    row['processed'] = True
    x['route_id'].sort(key=int)
    d.append(x)

print(df)
print(df.at[0,'stop_id'])

with open('stop_name.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=4)
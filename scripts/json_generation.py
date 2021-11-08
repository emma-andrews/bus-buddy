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
        'route_id': [],
        'route_id_times': []
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

keys = []

for i in range(len(d)):
    entry = d[i]
    for j in range(len(entry['route_id'])):
        keys.append(str(entry['stop_id']) + "_" + str(entry['route_id'][j]))

d2 = {key: [] for key in keys}

time_df = pd.read_csv("../csvs/timings.csv")

for index, row in time_df.iterrows():
    k = str(row['stop_id']) + "_" + str(row['route_id'])
    if k in d2:
        d2[k].append(row['arrival_time'])

for i in range(len(d)):
    entry = d[i]
    for j in range(len(entry['route_id'])):
        k = str(entry['stop_id']) + "_" + str(entry['route_id'][j])
        if k in d2:
            d2[k].sort()
            entry['route_id_times'].append(d2[k])

with open('stop_name_time.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=4)

with open('stop_name_time_noformat.json', 'w', encoding='utf-8') as f:
    json.dump(d, f)
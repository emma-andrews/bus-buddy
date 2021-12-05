import pandas as pd
import datetime
import math
import json

in_file = "../csvs/stop_times.csv"
in_file2 = "../csvs/trips.csv"

df_times = pd.read_csv(in_file, keep_default_na=False)
df_trips = pd.read_csv(in_file2, keep_default_na=False)

data = []
checked = []
minIncrement = 0

for index, row in df_times.iterrows():
    trip_id = row['trip_id']
    row2 = df_trips.loc[df_trips['trip_id'] == trip_id]
    stop_seq = row['stop_sequence']
    route = row2.iat[-1, 1]
    if stop_seq == 0:
        row3 = df_times.iloc[index + 1]
        first = row["departure_time"]
        last = row3["arrival_time"]
        hour = int(last[0:2])
        if hour > 23:
            hour = hour - 24
        t = datetime.time(hour, int(last[3:5]), int(last[6:8]))
        arrival = datetime.datetime.combine(datetime.date.today(), t)

        hour = int(first[0:2])
        if hour > 23:
            hour = hour - 24
        t = datetime.time(hour, int(first[3:5]), int(first[6:8]))
        departure = datetime.datetime.combine(datetime.date.today(), t)
        diff = arrival - departure
        minIncrement = math.ceil(diff.total_seconds() / 60)
    data.append([route, row['stop_id'], stop_seq, minIncrement])

df = pd.DataFrame(data, columns=['route_id', 'stop_id', 'stop_seq','increment'])
df = df.drop_duplicates(subset=['route_id', 'stop_id', 'stop_seq'])
#df.to_csv("../csvs/length.csv",index=False)
d = []
processed = [False] * df['stop_id'].count()
df['processed'] = processed

routes = [1,2,3,5,6,7,8,9,10,11,12,13,15,16,17,20,21,23,24,25,26,27,28,33,34,35,36,37,38,40,43,46,75,118,119,122,125,126,127,711,800,121,150,76]
routes.sort()
curRoute = routes[0]
index = 0

for index, row in df.iterrows():
    if row['processed'] and row['route_id'] != curRoute:
        continue

    route = row['route_id']
    increment = row['increment']
    x = {
        'route_id': route,
        'increment': increment,
        '0': [],
        '1': []
    }

    on0 = True
    firstEncounter = True
    on1 = False
    zero = []
    one = []

    for index2, row2 in df.iterrows():
        if row2['processed'] or row2['route_id'] != curRoute:
            x['1'] = one
            break
        else:
            row2['processed'] = True
            if on0:
                if row2['stop_seq'] == 0 and firstEncounter:
                    firstEncounter = False
                    zero.append(row2['stop_id'])
                elif row2['stop_seq'] == 0 and not firstEncounter:
                    x['0'] = zero
                    one = []
                    one.append(row2['stop_id'])
                    on0 = False
                    on1 = True
                else:
                    zero.append(row2['stop_id'])
            elif on1:
                one.append(row2['stop_id'])

    row['processed'] = True
    d.append(x)
    index += 1
    if index < len(routes):
        curRoute = routes[index]

with open('../csvs/length.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=4)
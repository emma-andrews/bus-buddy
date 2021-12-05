import pandas as pd
import datetime
import math

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
df.to_csv("../csvs/length.csv",index=False)
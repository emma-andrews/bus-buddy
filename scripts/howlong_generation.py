import pandas as pd
import csv
import sys

in_file = "../csvs/stop_times.csv"
in_file2 = "../csvs/trips.csv"

df_times = pd.read_csv(in_file, keep_default_na=False)
df_trips = pd.read_csv(in_file2, keep_default_na=False)

data = []
checked = []

for index, row in df_times.iterrows():
    trip_id = row['trip_id']
    row2 = df_trips.loc[df_trips['trip_id'] == trip_id]
    stop_seq = row['stop_sequence']
    route = row2.iat[-1, 1]
    data.append([route, row['stop_id'], stop_seq])

df = pd.DataFrame(data, columns=['route_id', 'stop_id', 'stop_seq'])
df = df.drop_duplicates()
df.to_csv("../csvs/length.csv",index=False)
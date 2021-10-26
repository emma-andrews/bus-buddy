import pandas as pd
import datetime
import csv
import sys

# in stop times, fill in empty arrival and departure times using sequence numbers and first and last times of arrival/destination for the route
in_file = "../V02Fall2021google_transit/stop_times.txt"

df = pd.read_csv(in_file, keep_default_na=False)

first = ""
last = ""
i = 0

for index, row in df.iterrows():
    if index == 0:
        first = row["departure_time"]
        i = 0
        
    if (row["stop_sequence"] == 0 and index != 0) or index == len(df) - 1:
        k = index - 1
        if index == len(df) - 1:
            k = index
        row_stop = df.iloc[k]
        last = row_stop["arrival_time"]
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

        # Increment amount in seconds
        increment = diff.total_seconds() / (row_stop["stop_sequence"] + 1)

        for j in range(i+1,k):
            departure = departure + datetime.timedelta(seconds=increment)
            s = departure.strftime("%H:%M:%S")
            df.at[j, "arrival_time"] = s
            df.at[j, "departure_time"] = s

        i = index
        first = row["departure_time"]

df.to_csv("stops.csv", index=None)

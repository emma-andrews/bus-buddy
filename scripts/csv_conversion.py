import pandas as pd
import csv
import sys

# python3 csv_conversion.py inputfile outputfile [columns to choose]

in_file = sys.argv[1]
out_file = sys.argv[2]
cols = sys.argv[3:]

read_file = pd.read_csv (in_file)
read_file.to_csv (out_file, index=None, quoting=csv.QUOTE_NONNUMERIC, columns=cols)
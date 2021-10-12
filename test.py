import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

DB_CONF_PATH = "final project\\db_config.json"
cred = credentials.Certificate(DB_CONF_PATH)
firebase_admin.initialize_app(cred)

client = firestore.client()
#  db read
# docs = client.collection(u"calendar_dates").get()
#     for doc in docs:
#         print(u"{} => {}".format(doc.id, doc.to_dict()))


def loadFromTxt(p):

    print("\n\n\n-----------------------------------------")
    print("loading:", p)
    with open(p) as f:
        import csv

        collection_name = os.path.splitext(os.path.basename(f.name))[0]
        print("creating collection:", collection_name)

        db = client.collection(collection_name)
        reader = csv.DictReader(f)
        # reader = csv.reader(f)
        row_counter = 0
        for row in reader:
            print(row_counter, row)
            doc = db.document(str(row_counter))
            doc.set(row)
            row_counter = row_counter + 1


""""
# agency.txt
# calendar.txt
# calendar_dates.txt
# feed_info.txt
# routes.txt
shapes.txt   ???????
# stops.txt
stop_times.txt ?????
# trips.txt
"""
# dir = ".\\final project\\V02Fall2021google_transit\\"
# files_path = [os.path.abspath(os.path.join(dir, x)) for x in os.listdir(dir)]
dir = "C:\\Users\\ccdre\\OneDrive\\Get Things Done\\Courses\\CIS6930 - Spoken Dialogue Systems\\final project\\V02Fall2021google_transit\\"
files_path = [
    dir + "shapes.txt",
    dir + "stop_times.txt",
]
# for i in files_path:
    # loadFromTxt(i)
    # print(os.path.basename(i))

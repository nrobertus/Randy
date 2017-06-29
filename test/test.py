from datetime import datetime
import requests
import time

#dates = [datetime.now(), datetime.now(), datetime.now()]
dates = [datetime.now()]

r = requests.post("http://randythehamster.com:3000/rotations", {'dates':dates})
print r.text

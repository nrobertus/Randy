#!/usr/bin/env python

import sqlite3
import os
import time
import datetime
import threading
import random
from time import sleep
from datetime import timedelta
import smtplib

import MySQLdb


db = MySQLdb.connect("localhost", "pi", "randy4thewin", "randy")
curs=db.cursor()



def heartbeat():
    while True:
        try:
            print "Heart beating"
            curs.execute("""INSERT INTO heartbeat (date, time, status) values(CURRENT_DATE(), NOW(), 'Healthy')""")
            db.commit()
            time.sleep(10)
        except:
            print "Error, rolling database back"
            db.rollback()

def gpio(): # Use this for sensing wheel rotations.
    while True:
        #if(){ #If rotation is detected
            #curs.execute("""INSERT INTO rotations (date, time, speed) values(CURRENT_DATE(), NOW(), 0)""")
            #db.commit()
        #}
        time.sleep(0.5)


heartbeatthread = threading.Thread(target=heartbeat)
gpiothread = threading.Thread(target=gpio)

threads = [heartbeatthread, gpiothread]

heartbeatthread.start()
gpiothread.start()

while True: # Master loop
    for thread in threads:
        if not thread.isAlive():
            print "Caught a thread, restarting"
            thread.start()
    time.sleep(5 * 60) # every five minutes, restart all dead threads.





#print "\nEntire database contents:\n"
#for row in curs.execute("SELECT * FROM rotations"):
#    print row

#print "\nDatabase entries for running:\n"
#for row in curs.execute("SELECT * FROM rotations WHERE type='run'"):
#    print row

conn.close()

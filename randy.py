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
            time.sleep(60)
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

def health_monitor():
    while True: #Check every hour
        last_24 = 0
        heartbeat = 0
        for row in curs.execute("SELECT COUNT(*) as count FROM rotations WHERE date >= now() - INTERVAL 1 DAY"):
            last_24 = row.count
        for row in curs.execute("SELECT COUNT(*) as count FROM heartbeat WHERE date >= now() - INTERVAL 1 DAY"):
            heartbeat = row.count

        if(heartbeat > 0 and last_24 == 0):
            print "Error, no rotations found"
        time.sleep(5)
        #time.sleep(60*60)


heartbeatthread = threading.Thread(target=heartbeat)
gpiothread = threading.Thread(target=gpio)
healththread = threading.Thread(target=health_monitor)

threads = [heartbeatthread, gpiothread, healththread]

heartbeatthread.start()
gpiothread.start()
healththread.start()

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

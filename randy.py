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

conn=sqlite3.connect('randy.db', check_same_thread=False)
curs=conn.cursor()



def heartbeat():
    while True:
        print "Heart beating"
        curs.execute("""INSERT INTO heartbeat values(date('now'), time('now'), 'Healthy')""");
        conn.commit();
        time.sleep(10);

def gpio(): # Use this for sensing wheel rotations.
    while True:
        if(){ #If rotation is detected
            #curs.execute("""INSERT INTO rotations values(date('now'), time('now'), 0)""");
            #conn.commit();
        }
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

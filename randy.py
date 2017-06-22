#!/usr/bin/env python

import sqlite3
import os
import time
import datetime
import threading
import random
from time import sleep, gmtime, strftime, localtime
from datetime import timedelta
import smtplib
import MySQLdb
import RPi.GPIO as GPIO


#######################################
##  GPIO Setup
#######################################

GPIO_INPUT_PORT = 17
GPIO.setmode(GPIO.BCM)
GPIO.setup(GPIO_INPUT_PORT, GPIO.IN, pull_up_down=GPIO.PUD_UP)

#######################################
##  SMS Setup
#######################################

f = open('/home/pi/keys/credentials.txt', 'r')
username = f.readline()
password = f.readline()
fromaddr = f.readline()
recipients = []
recipients.append(f.readline().rstrip())
formatRecipients()
f.close()

server = smtplib.SMTP("smtp.gmail.com:587")

#######################################
##  Helper and Callback functions
#######################################

def rotation_callback(channel):
    try:
        print "Logging rotation"
        curs.execute("""INSERT INTO rotations (date, time, speed) values(CURRENT_DATE(), NOW(), 0)""")
        db.commit()
    except:
        print "Error, rolling database back"
        db.rollback()

def sendMessage(body):
    server.starttls()
    server.login(username,password)
    for number in recipients:
        server.sendmail(fromaddr, number, body)
    server.quit()

def formatRecipients():
    for i,recipient in enumerate(recipients):
        recipients[i] = str(recipient) + '@vtext.com'

#######################################
##  Thread functions
#######################################

def heartbeat():
    db = MySQLdb.connect("localhost", "pi", "randy4thewin", "randy")
    curs=db.cursor()
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
    GPIO.add_event_detect(GPIO_INPUT_PORT, GPIO.FALLING, callback=rotation_callback, bouncetime=300)

def health_monitor():
    db = MySQLdb.connect("localhost", "pi", "randy4thewin", "randy")
    curs=db.cursor()

    while True: #Check every hour
        last_24 = 0
        heartbeat = 0
        try:
            curs.execute("SELECT COUNT(*) as count FROM rotations WHERE date >= now() - INTERVAL 1 DAY")
            last_24 = curs.fetchall()[0][0]
        except:
            print "Error, cannot select"
        try:
            curs.execute("SELECT COUNT(*) as count FROM heartbeat WHERE date >= now() - INTERVAL 1 DAY")
            heartbeat = curs.fetchall()[0][0]
        except:
            print "Error, cannot select"

        if(heartbeat > 0 and last_24 == 0):
            sendMessage("Randy hasn't run in the last 24 hours. You should check on him.")
        time.sleep(60*60)


#######################################
##  Thread setup
#######################################

heartbeatthread = threading.Thread(target=heartbeat)
healththread = threading.Thread(target=health_monitor)

threads = [heartbeatthread, healththread]

#######################################
##  SMS initialization
#######################################



#######################################
##  Starting the program
#######################################

heartbeatthread.start()
healththread.start()
gpio()

#######################################
##  Thread management
#######################################

while True: # Master loop
    for thread in threads:
        if not thread.isAlive():
            print "Caught a thread, restarting"
            thread.start()
    time.sleep(5 * 60) # every five minutes, restart all dead threads.

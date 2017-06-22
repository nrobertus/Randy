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

GPIO.setmode(GPIO.BCM)

f = open('/home/pi/keys/credentials.txt', 'r')

username = f.readline()
password = f.readline()
fromaddr = f.readline()
recipients = []
recipients.append(f.readline())

server = smtplib.SMTP("smtp.gmail.com:587")

def sendMessage(body):
    for number in recipients:
        server.sendmail(fromaddr, number, body)

def formatRecipients():
    for i,recipient in enumerate(recipients):
        recipients[i] = str(recipient) + '@vtext.com'

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
    db = MySQLdb.connect("localhost", "pi", "randy4thewin", "randy")
    curs=db.cursor()
    while True:
        #if(){ #If rotation is detected
            #curs.execute("""INSERT INTO rotations (date, time, speed) values(CURRENT_DATE(), NOW(), 0)""")
            #db.commit()
        #}
        time.sleep(0.5)

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


heartbeatthread = threading.Thread(target=heartbeat)
gpiothread = threading.Thread(target=gpio)
healththread = threading.Thread(target=health_monitor)

threads = [heartbeatthread, gpiothread, healththread]

server.starttls()
server.login(username,password)
formatRecipients()

heartbeatthread.start()
gpiothread.start()
healththread.start()

while True: # Master loop
    for thread in threads:
        if not thread.isAlive():
            print "Caught a thread, restarting"
            thread.start()
    time.sleep(5 * 60) # every five minutes, restart all dead threads.

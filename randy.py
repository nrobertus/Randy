#!/usr/bin/env python

import MySQLdb
import os
import random
import requests
import RPi.GPIO as GPIO
import smtplib
import time
import threading

from time import sleep, gmtime, strftime, localtime
from datetime import datetime


#######################################
##  Variables
#######################################

rotation_buffer = []

#######################################
##  Database constants
#######################################

DB_HOST = "localhost"
DB_USER = "pi"
DB_PSWD = "randy4thewin"
DB_DTBS = "randy"

#######################################
##  GPIO Setup
#######################################

GPIO_INPUT_PORT = 4
GPIO.setmode(GPIO.BCM)
GPIO.setup(GPIO_INPUT_PORT, GPIO.IN)

#######################################
##  SMS Setup
#######################################

f = open('/home/pi/keys/credentials.txt', 'r')
SMS_USER = f.readline()
SMS_PSWD = f.readline()
SMS_FROM = f.readline()
recipients = []
recipients.append(f.readline().rstrip())
f.close()

server = smtplib.SMTP("smtp.gmail.com:587")

#######################################
##  Helper and Callback functions
#######################################

def rotation_callback(channel):
    rotation_buffer.append(datetime.now())

def sendMessage(body):
    server.starttls()
    server.login(SMS_USER, SMS_PSWD)
    for number in recipients:
        server.sendmail(SMS_FROM, number, body)
    server.quit()

def formatRecipients():
    for i,recipient in enumerate(recipients):
        recipients[i] = str(recipient) + '@vtext.com'

def writeLogMessage(msg):
    print(str(datetime.now()) + " PY: " + msg)
#######################################
##  Thread functions
#######################################

def heartbeat():
    while True:
        try:
            r = requests.post("http://192.168.138.165:3000/heartbeat", {'date': datetime.now()})
        except:
            writeLogMessage("Failed to post heartbeat.")
        time.sleep(60)

def health_monitor():
    db = MySQLdb.connect(DB_HOST, DB_USER, DB_PSWD, DB_DTBS)
    curs=db.cursor()
    while True: #Check every hour
        last_24 = 0
        heartbeat = 0
        try:
            curs.execute("SELECT COUNT(*) as count FROM rotations WHERE date >= now() - INTERVAL 1 DAY")
            last_24 = curs.fetchall()[0][0]
        except:
            writeLogMessage("Error, cannot select")
        try:
            curs.execute("SELECT COUNT(*) as count FROM heartbeat WHERE date >= now() - INTERVAL 1 DAY")
            heartbeat = curs.fetchall()[0][0]
        except:
            writeLogMessage("Error, cannot select")

        if(heartbeat > 0 and last_24 == 0):
            sendMessage("Randy hasn't run in the last 24 hours. You should check on him.")
        time.sleep(60*60)

def rotation_manager():
    global rotation_buffer
    while True: #Check every three seconds for new rotations
        if(len(rotation_buffer) >= 1):
            buff = rotation_buffer[:] #Copy the buffer
            del rotation_buffer[:] #Clear the buffer
            try:
                r = requests.post("http://192.168.138.165:3000/rotations", {'dates':buff}) # Send the whole buffer over
            except:
                writeLogMessage("Failed to post rotations")
                rotation_buffer = rotation_buffer + buff # add back in those events for next time.
        time.sleep(3)

def gpio(): # Use this for sensing wheel rotations.
    GPIO.add_event_detect(GPIO_INPUT_PORT, GPIO.RISING, callback=rotation_callback, bouncetime=100)

#######################################
##  Thread setup
#######################################

heartbeatthread = threading.Thread(target=heartbeat)
healththread = threading.Thread(target=health_monitor)
rotationthread = threading.Thread(target=rotation_manager)

threads = [heartbeatthread, rotationthread]

#######################################
##  SMS initialization
#######################################

formatRecipients()

#######################################
##  Starting the program
#######################################

heartbeatthread.start()
#healththread.start()
rotationthread.start()
gpio()

#######################################
##  Thread management
#######################################

while True: # Master loop
    for thread in threads:
        if not thread.isAlive():
            writeLogMessage("Thread died. Rebooting the Pi.")
            os.system('sudo reboot')
    time.sleep(30) # every 30 seconds, check for dead threads. Just freakin reboot if you find one. I know, it's overkill, but I'm sick of losing tons of data.

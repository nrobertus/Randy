# Randy
A database / web server / api for tracking my hamster's activities. I know, it's awesome. 

# Contents

## randy.db
This is a SQLite3 server. It contains two tables:
### 1. heartbeat 
This is a table for verifying that everything is working. Every minute, an entry is added with a status flag to ensure that the database and GPIO sniffing programs are still operational. 

### 2. rotations
This is the table where the actual rotations are stored. Every time an interrupt fires from the GPIO, an entry with date, time, and speed is added. 
Speed will probably be implemented later, and calculated with a known width of reflective tape compared against the time of interrupt. 

## randy.py
This is the program that inserts data into the database and check the GPIO ports for incoming rotational data

## schema.txt 
A reference file for how the database schema is laid out. I kept forgetting.

## randy_server.py
This is a Flask web server implemented with Python. 

# Randy
A database / web server / api for tracking my hamster's activities. I know, it's awesome. [Check it out!](http://www.randythehamster.com)

## Contents

### randy.py
This is the program that inserts data into the database and check the GPIO ports for incoming rotational data.
It will also monitor activity, and if there has been none in 24 hours, it will text the owner. (me.)

### app.js
This is a node.js web server implemented with express.js. 

### index.html
This is the target of the apache2 server. It is the main web page for the project.

### /www
This is the subdirectory containing all of the resources used by index.html, including images, .js files, .css files and libraries. 

## Database
This is a MySQL server. The password is randy4thewin.
```
+-----------------+
| Tables_in_randy |
+-----------------+
| heartbeat       |
| rotations       |
+-----------------+
```

### 1. heartbeat 
This is a table for verifying that everything is working. Every minute, an entry is added with a status flag to ensure that the database and GPIO sniffing programs are still operational. 
```
+--------+---------+------+-----+---------+----------------+
| Field  | Type    | Null | Key | Default | Extra          |
+--------+---------+------+-----+---------+----------------+
| id     | int(11) | NO   | PRI | NULL    | auto_increment |
| date   | datetime| YES  |     | NULL    |                |
| status | text    | YES  |     | NULL    |                |
+--------+---------+------+-----+---------+----------------+
```
### 2. rotations
This is the table where the actual rotations are stored. Every time an interrupt fires from the GPIO, an entry with date/time and speed.
Speed will probably be implemented later, and calculated with a known width of reflective tape compared against the time of interrupt.
```
+---------+---------------+------+-----+---------+----------------+
| Field   | Type          | Null | Key | Default | Extra          |
+---------+---------------+------+-----+---------+----------------+
| id      | int(11)       | NO   | PRI | NULL    | auto_increment |
| date    | datetime      | YES  |     | NULL    |                |
| speed   | decimal(10,0) | YES  |     | NULL    |                |
+---------+---------------+------+-----+---------+----------------+
```

## TODO
* Flesh out usable API
* Implement UI for Apache server
* Resolve issues with SMS code in python running reliably
* Put python script startup command into [Raspberry Pi bootup procedure](https://www.raspberrypi.org/documentation/linux/usage/rc-local.md)

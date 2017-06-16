#!/usr/bin/env python

import sqlite3
import sched, time

conn=sqlite3.connect('randy.db')
curs=conn.cursor()
s = sched.scheduler(time.time, time.sleep)


def do_something(sc): 
    print "Heart beating"
    curs.execute("""INSERT INTO heartbeat values(date('now'), time('now'), 'Healthy')""");
    conn.commit();
    # do your stuff
    s.enter(60, 1, do_something, (sc,))

s.enter(60, 1, do_something, (s,))
s.run()
	


#print "\nEntire database contents:\n"
#for row in curs.execute("SELECT * FROM rotations"):
#    print row

#print "\nDatabase entries for running:\n"
#for row in curs.execute("SELECT * FROM rotations WHERE type='run'"):
#    print row

conn.close()

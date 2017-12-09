#!/usr/bin/python
import os, sys, site

activate_this = '/home/csstudent/venv/bin/activate_this.py'
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))

import sys
import logging
logging.basicConfig(stream=sys.stderr)
sys.path.insert(0,"/var/www/COMP47360/FlaskApp/")

from FlaskApp import app as application
application.secret_key = 'summerproject9'




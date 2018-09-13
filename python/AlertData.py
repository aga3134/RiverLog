# -*- coding: utf-8 -*-
"""
Created on Fri Aug 31 11:06:27 2018

@author: aga
"""

import requests
import json
import sys
import traceback

class AlertData:
    def __init__(self, db):
        self.db = db
    
    def CollectData(self):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
    
    def DataToDB(self):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
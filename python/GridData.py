# -*- coding: utf-8 -*-
"""
Created on Mon Oct 23 11:38:01 2017

@author: aga
"""

import datetime
import math

class GridData:
    def __init__(self, db):
        self.db = db
        self.levelNum = 6
        self.gridPerUnit = 100

    def AddGridRain(self, d):
        timeKey = "time"
        valueKey = ["now"]
        dayStr = d[timeKey].strftime('%Y%m%d')
        table = "rainGrid"+dayStr
        latKey = "lat"
        lngKey = "lon"
        self.AddGridData(table,d,timeKey,valueKey,latKey,lngKey)

    def AddGridData(self, table, d, timeKey, valueKey, latKey, lngKey):
        for level in range(self.levelNum):
            scale = self.gridPerUnit/math.pow(2,level)
            gridX = int(d[lngKey]*scale)
            gridY = int(d[latKey]*scale)

            key = {"lev":level,"t":d[timeKey],"x":gridX,"y":gridY}
            inc = {"num":1,"latSum":d[latKey],"lngSum":d[lngKey]}
            for v in valueKey:
                inc[v+"Sum"] = d[v]

            self.db[table].update(key,{"$inc": inc},upsert=True)
        
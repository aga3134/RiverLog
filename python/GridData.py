# -*- coding: utf-8 -*-
"""
Created on Mon Oct 23 11:38:01 2017

@author: aga
"""

import datetime
import math
import pytz
#using Asia/Taipei will cause offset to be +0806
#taiwan = pytz.timezone('Asia/Taipei')
taiwan = datetime.timezone(offset = datetime.timedelta(hours = 8))

class GridData:
    def __init__(self, db):
        self.db = db
        self.levelNum = 3
        self.gridPerUnit = 10

    def AddGridRain(self, d):
        timeKey = "time"
        valueKey = ["now"]
        t = d[timeKey].replace(tzinfo=pytz.utc).astimezone(taiwan)
        dayStr = t.strftime('%Y%m%d')
        table = "rainGrid"+dayStr
        latKey = "lat"
        lngKey = "lon"
        self.AddGridData(table,d,timeKey,valueKey,latKey,lngKey)

    def AddGridWaterLevel(self, d):
        timeKey = "RecordTime"
        valueKey = ["WaterLevel"]
        t = d[timeKey].replace(tzinfo=pytz.utc).astimezone(taiwan)
        dayStr = t.strftime('%Y%m%d')
        table = "waterLevelGrid"+dayStr
        latKey = "lat"
        lngKey = "lon"
        self.AddGridData(table,d,timeKey,valueKey,latKey,lngKey)

    def AddGridWaterLevelDrain(self, d):
        timeKey = "time"
        valueKey = ["value"]
        t = d[timeKey].replace(tzinfo=pytz.utc).astimezone(taiwan)
        dayStr = t.strftime('%Y%m%d')
        table = "waterLevelDrainGrid"+dayStr
        latKey = "lat"
        lngKey = "lng"
        self.AddGridData(table,d,timeKey,valueKey,latKey,lngKey)

    def AddGridWaterLevelAgri(self, d):
        timeKey = "time"
        valueKey = ["value"]
        t = d[timeKey].replace(tzinfo=pytz.utc).astimezone(taiwan)
        dayStr = t.strftime('%Y%m%d')
        table = "waterLevelAgriGrid"+dayStr
        latKey = "lat"
        lngKey = "lng"
        self.AddGridData(table,d,timeKey,valueKey,latKey,lngKey)

    def AddGridSewer(self, d):
        timeKey = "time"
        valueKey = ["value"]
        t = d[timeKey].replace(tzinfo=pytz.utc).astimezone(taiwan)
        dayStr = t.strftime('%Y%m%d')
        table = "sewerGrid"+dayStr
        latKey = "lat"
        lngKey = "lng"
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
        
    def AddGridBatch(self, table, arr, timeKey, valueKey, latKey, lngKey):
        batch = {}
        for d in arr:
            for level in range(self.levelNum):
                scale = self.gridPerUnit/math.pow(2,level)
                gridX = int(d[lngKey]*scale)
                gridY = int(d[latKey]*scale)

                key = str(level)+"-"+str(d[timeKey])+"-"+str(gridX)+"-"+str(gridY)
                if key in batch:
                    batch[key]["num"] += 1
                    batch[key]["latSum"] += d[latKey]
                    batch[key]["lngSum"] += d[lngKey]
                    for v in valueKey:
                        batch[key][v+"Sum"] += d[v]
                else:
                    batch[key] = {}
                    batch[key]["lev"] = level
                    batch[key]["t"] = d[timeKey]
                    batch[key]["x"] = gridX
                    batch[key]["y"] = gridY
                    batch[key]["num"] = 1
                    batch[key]["latSum"] = d[latKey]
                    batch[key]["lngSum"] = d[lngKey]
                    for v in valueKey:
                        batch[key][v+"Sum"] = d[v]

        print("batch num: "+ str(len(batch)))
        for key in batch:
            d = batch[key]
            key = {"lev":d["lev"],"t":d["t"],"x":d["x"],"y":d["y"]}
            inc = {"num":d["num"],"latSum":d["latSum"],"lngSum":d["lngSum"]}
            for v in valueKey:
                inc[v+"Sum"] = d[v+"Sum"]
            self.db[table].update(key,{"$inc": inc},upsert=True)
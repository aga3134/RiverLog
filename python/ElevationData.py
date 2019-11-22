# -*- coding: utf-8 -*-
"""
Created on Mon Oct 23 11:38:01 2017

@author: aga
"""

import util
import math
import os

class ElevationData:
    def __init__(self, db):
        self.db = db
        self.levelNum = 8
        self.gridPerUnit = 1000

    def CollectDataFromFolder(self,folder):
        for filename in os.listdir(folder):
            print("process "+folder+"/"+filename)
            with open(folder+"/"+filename, 'r') as f:
                lines = f.readlines()
                batch = {}
                for line in lines:
                    data = line.split(" ")
                    lat,lng = util.TW97ToLatLng(util.ToInt(data[0]),util.ToInt(data[1]))
                    d = {}
                    d["lat"] = lat
                    d["lng"] = lng
                    d["elev"] = util.ToFloat(data[2])
                    #self.AddGridData(d)
                    for level in range(self.levelNum):
                        scale = self.gridPerUnit/math.pow(2,level)
                        gridX = int(d["lng"]*scale)
                        gridY = int(d["lat"]*scale)

                        key = str(level)+"-"+str(gridX)+"-"+str(gridY)
                        if key in batch:
                            batch[key]["num"] += 1
                            batch[key]["elevSum"] += d["elev"]
                        else:
                            batch[key] = {
                                "lev":level,
                                "x":gridX,
                                "y":gridY,
                                "num":1,
                                "elevSum":d["elev"]
                            }
                self.AddGridBatch(batch)
                

    def AddGridData(self, d):
        for level in range(self.levelNum):
            scale = self.gridPerUnit/math.pow(2,level)
            gridX = int(d["lng"]*scale)
            gridY = int(d["lat"]*scale)

            key = {"lev":level,"x":gridX,"y":gridY}
            inc = {"num":1,"elevSum":d["elev"]}
            self.db["elevGrid"].update(key,{"$inc": inc},upsert=True)

    def AddGridBatch(self,batch):
        for batchKey in batch:
            d = batch[batchKey]
            key = {"lev":d["lev"],"x":d["x"],"y":d["y"]}
            inc = {"num":d["num"],"elevSum":d["elevSum"]}
            self.db["elevGrid"].update(key,{"$inc": inc},upsert=True)
        
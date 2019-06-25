# -*- coding: utf-8 -*-
"""
Created on Fri Aug 31 11:06:27 2018

@author: aga
"""

import requests
import json
import sys
import traceback
import xml.etree.ElementTree as ET
import urllib.request
import datetime
import util
import os
import gc
import math

class WeatherData:
    def __init__(self, db):
        self.db = db
        config = json.loads(open("../config.json",encoding="utf8").read())
        self.key = config["weatherAPIKey"]
        
    def Init(self):
        pass
    
    def CollectData10min(self):
        try:
            print("collect rain data 10min")
            now = datetime.datetime.now()
            now = now.replace(minute=(now.minute-now.minute%10))
            t = now.strftime("%Y-%m-%d_%H-%M")
            #rain data
            url = "https://opendata.cwb.gov.tw/opendataapi?dataid=O-A0002-001&authorizationkey="+self.key
            folder = "data/rain/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"rain_"+t+".xml"
            urllib.request.urlretrieve(url, file)
            self.ProcessRain(file)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
    
    def CollectData1hour(self):
        pass
            
    def CollectData1day(self):
        pass
    
    def ProcessRain(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                data = f.read()
                root = ET.fromstring(data)
                pos = root.tag.find("}")
                ns = root.tag[:pos+1]
    
                stationArr = []
                locHash = {}
                dataArr = []
                for location in root.findall(ns+'location'):
                    data = {}
                    station = {}
                    dateStr = location.find(ns+"time").find(ns+"obsTime").text
                    dateStr = ''.join(dateStr.rsplit(':', 1))   #去掉時區的:
                    dateObj = datetime.datetime.strptime(dateStr, "%Y-%m-%dT%H:%M:%S%z")
                    data["time"] = dateObj
                    sID = location.find(ns+"stationId").text
                    sName = location.find(ns+"locationName").text
                    lat = util.ToFloat(location.find(ns+"lat").text)
                    lon = util.ToFloat(location.find(ns+"lon").text)
                    data["stationID"] = sID
                    station["stationID"] = sID
                    station["name"] = sName
                    station["lat"] = lat
                    station["lon"] = lon
                    locHash[sID] = {"lat":lat,"lon":lon}
                    
                    for elem in location.findall(ns+"weatherElement"):
                        if(elem[0].text == "HOUR_12"):
                            data["hour12"] = util.ToFloat(elem[1][0].text)
                        elif(elem[0].text == "HOUR_24"):
                            data["hour24"] = util.ToFloat(elem[1][0].text)
                        elif(elem[0].text == "NOW"):
                            data["now"] = util.ToFloat(elem[1][0].text)
                    if math.isnan(data["now"]) or data["now"] < 0:
                        continue
                            
                    for param in location.findall(ns+"parameter"):
                        if(param[0].text == "CITY"):
                            station["city"] = param[1].text
                        elif(param[0].text == "TOWN"):
                            station["town"] = param[1].text
                        
                    dataArr.append(data)
                    stationArr.append(station)
                    
                #print(dataArr)
                #print(stationArr)
                for s in stationArr:
                    key = {"stationID":s["stationID"]}
                    self.db["rainStation"].update(key,s,upsert=True)
                    
                for d in dataArr:
                    dayStr = d["time"].strftime('%Y%m%d')
                    key = {"stationID":d["stationID"],"time":d["time"]}
                    query = self.db["rain"+dayStr].find_one(key)
                    if query is None:
                        self.db["rain"+dayStr].insert_one(d)
                        inc = {}
                        loc = locHash[d["stationID"]]
                        area = util.LatToArea(loc["lat"])
                        inc[area+"Sum"] = d["now"]
                        inc[area+"Num"] = 1
                        tday = d["time"].replace(hour=0,minute=0,second=0)
                        t10min = d["time"].replace(minute=(d["time"].minute-d["time"].minute%10),second=0)
                        self.db["rainDailySum"].update({"time":tday},{"$inc":inc},upsert=True)
                        self.db["rain10minSum"].update({"time":t10min},{"$inc":inc},upsert=True)
                
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessHistory(self):
        batchNum = 16
        folder = "data/rain/"
        for i,filename in enumerate(os.listdir(folder)):
            self.ProcessRain(folder+filename)
            if i % batchNum == 0:
                print("garbage collection")
                gc.collect()
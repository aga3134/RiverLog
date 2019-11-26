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
from bs4 import BeautifulSoup
from GridData import GridData
import pytz
import pymongo
#using Asia/Taipei will cause offset to be +0806
#taiwan = pytz.timezone('Asia/Taipei')
taiwan = datetime.timezone(offset = datetime.timedelta(hours = 8))

class WeatherData:
    def __init__(self, db):
        self.db = db
        config = json.loads(open("../config.json",encoding="utf8").read())
        self.key = config["weatherAPIKey"]
        self.grid = GridData(db)
        
    def Init(self):
        self.AddTideSite()
    
    def CollectData10min(self):
        try:
            print("collect rain data 10min")
            now = datetime.datetime.now()
            now = now.replace(minute=(now.minute-now.minute%10))
            t = now.strftime("%Y-%m-%d_%H-%M")
            #rain data
            self.ProcessRain("https://opendata.cwb.gov.tw/opendataapi?dataid=O-A0002-001&authorizationkey="+self.key)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
    
    def CollectData1hour(self):
        try:
            print("collect typhoon data 1hour")
            now = datetime.datetime.now()
            t = now.strftime("%Y-%m-%d_%H")
            #typhoon trajectory
            self.ProcessTyphoon("https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/W-C0034-005?format=XML&Authorization="+self.key)
            self.ProcessTide("https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/O-A0017-001?format=JSON&Authorization="+self.key)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def CollectData1day(self):
        pass

    def AddTideSite(self):
        try:
            print("add tide sites")
            with open("tide.json","r",encoding="utf-8-sig") as f:
                data = f.read()
                site = json.loads(data)
                ops = []
                for s in site:
                    key = {"id":s["id"]}
                    ops.append(pymongo.UpdateOne(key, {"$set": s}, upsert=True))
                if len(ops) > 0:
                    self.db["tideStation"].bulk_write(ops,ordered=False)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
    
    def ProcessRain(self,url):
        print("process rain url: %s" % url)
        try:
            r = requests.get(url)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                root = ET.fromstring(r.text)
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
                    #雨量從00:10累積到隔天00:00，原始資料以累積結束時間當資料時間，這邊減10分鐘以累積起始時間當資料時間
                    dateObj = dateObj - datetime.timedelta(minutes=10)
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
                opSite = []
                for s in stationArr:
                    key = {"stationID":s["stationID"]}
                    #self.db["rainStation"].update(key,s,upsert=True)
                    opSite.append((pymongo.UpdateOne(key, {"$set": s}, upsert=True)))
                if len(opSite) > 0:
                    self.db["rainStation"].bulk_write(opSite,ordered=False)

                opData = {}
                opDaily = []
                op10min = []
                gridArr = {}
                for d in dataArr:
                    dayStr = d["time"].strftime('%Y%m%d')
                    if dayStr not in opData:
                        opData[dayStr] = []
                    if dayStr not in gridArr:
                        gridArr[dayStr] = []

                    key = {"stationID":d["stationID"],"time":d["time"]}
                    query = self.db["rain"+dayStr].find_one(key)
                    if query is None:
                        #self.db["rain"+dayStr].insert_one(d)
                        opData[dayStr].append(pymongo.UpdateOne(key, {"$set": d}, upsert=True))
                        inc = {}
                        loc = locHash[d["stationID"]]
                        area = util.LatToArea(loc["lat"])
                        inc[area+"Sum"] = d["now"]
                        inc[area+"Num"] = 1
                        tday = d["time"].replace(hour=0,minute=0,second=0)
                        t10min = d["time"].replace(minute=(d["time"].minute-d["time"].minute%10),second=0)
                        #self.db["rainDailySum"].update({"time":tday},{"$inc":inc},upsert=True)
                        #self.db["rain10minSum"].update({"time":t10min},{"$inc":inc},upsert=True)
                        opDaily.append(pymongo.UpdateOne({"time":tday}, {"$inc": inc}, upsert=True))
                        op10min.append(pymongo.UpdateOne({"time":t10min}, {"$inc": inc}, upsert=True))
                        #self.grid.AddGridRain(d)
                        grid = d.copy()
                        grid["lat"] = loc["lat"]
                        grid["lon"] = loc["lon"]
                        gridArr[dayStr].append(grid)

                for key in opData:
                    self.db["rain"+key].create_index("stationID")
                    self.db["rain"+key].create_index("time")
                    if len(opData[key]) > 0:
                        self.db["rain"+key].bulk_write(opData[key],ordered=False)

                if len(opDaily) > 0:
                    self.db["rainDailySum"].bulk_write(opDaily,ordered=False)
                if len(op10min) > 0:
                    self.db["rain10minSum"].bulk_write(op10min,ordered=False)

                for key in gridArr:
                    self.grid.AddGridBatch("rainGrid"+key,gridArr[key],"time",["now"],"lat","lon")
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessTyphoon(self, url):
        print("process typhoon url: %s" % url)
        try:
            r = requests.get(url)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                soup = BeautifulSoup(r.text, 'html.parser')
                typhoon = soup.find_all("tropicalcyclone")
                ops = []
                for tp in typhoon:
                    for pos in tp.analysis_data.find_all("fix"):
                        data = {}
                        if not tp.typhoon_name is None:
                            data["typhoon_name"] = tp.typhoon_name.string
                        if not tp.cwb_typhoon_name is None:
                            data["cwb_typhoon_name"] = tp.cwb_typhoon_name.string
                        if not tp.cwb_td_no is None:
                            data["cwb_td_no"] = tp.cwb_td_no.string

                        dateStr = pos.fix_time.string
                        dateStr = ''.join(dateStr.rsplit(':', 1))   #去掉時區的:
                        dateObj = datetime.datetime.strptime(dateStr, "%Y-%m-%dT%H:%M:%S%z")
                        data["time"] = dateObj

                        tpID = ""
                        if "typhoon_name" in data:
                            tpID += data["typhoon_name"]
                        if "cwb_typhoon_name" in data:
                            tpID += data["cwb_typhoon_name"]
                        if "cwb_td_no" in data:
                            tpID += data["cwb_td_no"]
                        data["_id"] = tpID+"_"+dateStr
                        
                        latlng = pos.coordinate.string.split(",")
                        data["lat"] = util.ToFloat(latlng[1])
                        data["lng"] = util.ToFloat(latlng[0])
                        data["max_wind_speed"] = util.ToFloat(pos.max_wind_speed.string)
                        data["max_gust_speed"] = util.ToFloat(pos.max_gust_speed.string)
                        data["pressure"] = util.ToFloat(pos.pressure.string)
                        data["circle_of_15ms"] = util.ToFloat(pos.circle_of_15ms.radius.string)
                        data["circle_of_25ms"] = util.ToFloat(pos.circle_of_25ms.radius.string)
                        key = {"_id":data["_id"]}
                        #self.db["typhoon"].update(key,data,upsert=True)
                        ops.append(pymongo.UpdateOne(key, {"$set": data}, upsert=True))
                if len(ops) > 0:
                    self.db["typhoon"].bulk_write(ops,ordered=False)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessTide(self, url):
        print("process tide url: %s" % url)
        try:
            r = requests.get(url)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                ops = {}
                tideArr = result["cwbopendata"]["dataset"]["location"]
                for tide in tideArr:
                    for time in tide["time"]:
                        dateStr = ''.join(time["obsTime"].rsplit(':', 1))   #去掉時區的:
                        dateObj = datetime.datetime.strptime(dateStr, "%Y-%m-%dT%H:%M:%S%z")
                        t10min = dateObj.replace(minute=(dateObj.minute-dateObj.minute%10),second=0)
                        dayStr = dateObj.strftime('%Y%m%d')
                        if not dayStr in ops:
                            ops[dayStr] = []
                        
                        value = time["weatherElement"]["elementValue"]["value"]
                        if not value:
                            continue
                        d = {}
                        d["stationID"] = tide["stationId"]
                        d["time"] = t10min
                        d["value"] = util.ToFloat(value)*0.01
                        key = {"stationID":d["stationID"],"time":d["time"]}
                        ops[dayStr].append(pymongo.UpdateOne(key, {"$set": d}, upsert=True))
                for key in ops:
                    self.db["tide"+key].create_index("stationID")
                    self.db["tide"+key].create_index("time")
                    if len(ops[key]) > 0:
                        self.db["tide"+key].bulk_write(ops[key],ordered=False)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            

    def GenGridFromDB(self,startDate,endDate):
        try:
            start = datetime.datetime.strptime(startDate, "%Y-%m-%d")
            end = datetime.datetime.strptime(endDate, "%Y-%m-%d")
            day = start

            siteHash = {}
            siteArr = self.db["rainStation"].find({})
            for s in siteArr:
                siteHash[s["stationID"]] = s

            while(day <= end):
                dayStr = datetime.datetime.strftime(day,"%Y%m%d")
                print("generate grid for "+dayStr)
                query = self.db["rain"+dayStr].find({})
                arr = []
                for row in query:
                    s = siteHash[row["stationID"]]
                    d = {}
                    t = row["time"].replace(tzinfo=pytz.utc).astimezone(taiwan)
                    d["time"] = t
                    d["now"] = row["now"]
                    if d["now"] < 0:
                        d["now"] = 0
                    d["lat"] = s["lat"]
                    d["lon"] = s["lon"]
                    arr.append(d)

                print("data num: "+str(len(arr)))
                self.grid.AddGridBatch("rainGrid"+dayStr,arr,"time",["now"],"lat","lon")

                day = day + datetime.timedelta(days=1) 
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
        
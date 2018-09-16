# -*- coding: utf-8 -*-
"""
Created on Fri Aug 31 11:06:27 2018

@author: aga
"""

import requests
import json
import sys
import traceback
import datetime
import urllib.request
import util
import os
import gc

class WaterData:
    def __init__(self, db):
        self.db = db
            
    def Init(self):
        self.AddWaterLevelSite()
        self.AddReservoirSite()
            
    def CollectData10min(self):
        try:
            print("collect water data 10min")
            now = datetime.datetime.now()
            now = now.replace(minute=(now.minute-now.minute%10))
            t = now.strftime("%Y-%m-%d_%H-%M")
            #water level
            url = "https://data.wra.gov.tw/Service/OpenData.aspx?format=json&id=2D09DB8B-6A1B-485E-88B5-923A462F475C"
            folder = "data/waterLevel/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"waterLevel_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessWaterLevel(file)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def CollectData1hour(self):
        try:
            print("collect water data 1hour")
            now = datetime.datetime.now()
            t = now.strftime("%Y-%m-%d_%H")
            #reservoir data
            url = "https://data.wra.gov.tw/Service/OpenData.aspx?format=json&amp=&id=1602CA19-B224-4CC3-AA31-11B1B124530F"
            folder = "data/reservoir/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"reservoir_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessReservoir(file)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
        
    
    def CollectData1day(self):
        pass
    
    def AddWaterLevelSite(self):
        try:
            print("add water level sites")
            #water level sites
            url = "https://data.wra.gov.tw/Service/OpenData.aspx?format=json&id=28E06316-FE39-40E2-8C35-7BF070FD8697"
            r = requests.get(url)
            r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                data = json.loads(r.text)
                for d in data["RiverStageObservatoryProfile_OPENDATA"]:
                    site = {}
                    site["BasinIdentifier"] = d["BasinIdentifier"].strip()
                    site["AffiliatedBasin"] = d["AffiliatedBasin"]
                    site["AffiliatedSubsidiaryBasin"] = d["AffiliatedSubsidiaryBasin"]
                    site["AffiliatedSubSubsidiaryBasin"] = d["AffiliatedSubSubsidiaryBasin"]
                    site["AlertLevel1"] = util.ToFloat(d["AlertLevel1"])
                    site["AlertLevel2"] = util.ToFloat(d["AlertLevel2"])
                    site["AlertLevel3"] = util.ToFloat(d["AlertLevel3"])
                    site["LocationAddress"] = d["LocationAddress"]
                    loc = d["LocationByTWD97_XY"].split(" ")
                    lat,lon = util.TW97ToLatLng(float(loc[0]),float(loc[1]))
                    site["lat"] = lat
                    site["lon"] = lon
                    site["ObservatoryName"] = d["ObservatoryName"].strip()
                    site["RiverName"] = d["RiverName"]
                    site["TownIdentifier"] = d["TownIdentifier"]
                    
                    key = {"BasinIdentifier":d["BasinIdentifier"]}
                    self.db["waterLevelStation"].update(key,site,upsert=True)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def AddReservoirSite(self):
        try:
            print("add reservoir sites")
            
            #map site id/latlng from name
            siteHash = {}
            with open("reservoir.json","r",encoding="utf-8-sig") as f:
                data = f.read()
                info = json.loads(data)
                for r in info:
                    siteHash[r["name"]] = r
            
            #download site info
            url = "http://data.wra.gov.tw/Service/OpenData.aspx?format=json&amp=&id=D54BA676-ED9A-4077-9A10-A0971B3B020C"
            r = requests.get(url)
            r.encoding = "utf-8-sig"
            if r.status_code == requests.codes.all_okay:
                data = json.loads(r.text)
                reservoirs = data["TaiwanWaterExchangingData"]["HydrologyReservoirClass"]["ReservoirsInformation"]
                for r in reservoirs:
                    if r["ReservoirName"] not in siteHash:
                        print("reservoir %s not found" % r["ReservoirName"] )
                        continue
                    s = siteHash[r["ReservoirName"]]
                    r["CatchmentArea"] = util.ToFloat(r["CatchmentArea"])
                    r["CurruntCapacity"] = util.ToFloat(r["CurruntCapacity"])
                    r["CurruntEffectiveCapacity"] = util.ToFloat(r["CurruntEffectiveCapacity"])
                    r["DesignedCapacity"] = util.ToFloat(r["DesignedCapacity"])
                    r["DesignedEffectiveCapacity"] = util.ToFloat(r["DesignedEffectiveCapacity"])
                    r["FullWaterLevelArea"] = util.ToFloat(r["FullWaterLevelArea"])
                    r["Height"] = util.ToFloat(r["Height"])
                    r["Length"] = util.ToFloat(r["Length"])
                    r["Year"] = util.ToFloat(r["Year"])
                    r["id"] = s["id"]
                    r["lat"] = util.ToFloat(s["lat"])
                    r["lng"] = util.ToFloat(s["lng"])
                    r["DeadStorageLevel"] = util.ToFloat(s["DeadStorageLevel"])
                    r["EffectiveCapacity"] = util.ToFloat(s["EffectiveCapacity"])
                    r["FullWaterLevel"] = util.ToFloat(s["FullWaterLevel"])
                    key = {"ReservoirName":r["ReservoirName"],"Year":r["Year"]}
                    self.db["reservoirInfo"].update(key,r,upsert=True)
                    
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
    
    def ProcessWaterLevel(self,file):
        print("process file %s" % file)
        try:
            #map site info from id
            attr = {"BasinIdentifier":1,"lat":1,"lon":1,"AlertLevel1":1,"AlertLevel2":1,"AlertLevel3":1}
            cursor = self.db["waterLevelStation"].find({},attr)
            siteHash = {}
            for site in cursor:
                siteHash[site["BasinIdentifier"]] = site
            
            with open(file,"r",encoding="utf8") as f:
                data = f.read()
                waterLevel = json.loads(data)
                for w in waterLevel["RealtimeWaterLevel_OPENDATA"]:
                    day = (w["RecordTime"].split("T")[0]).replace("-","")
                    t = datetime.datetime.strptime(w["RecordTime"], "%Y-%m-%dT%H:%M:%S")
                    w["RecordTime"] = t
                    w["WaterLevel"] = util.ToFloat(w["WaterLevel"])
                    key = {"StationIdentifier":w["StationIdentifier"],"RecordTime":t}
                    query = self.db["waterLevel"+day].find_one(key)
                    if query is None:
                        self.db["waterLevel"+day].insert_one(w)
                    
                        #計算北中南平均警戒程度
                        if w["StationIdentifier"] not in siteHash:
                            #print("water level site %s not found" % w["StationIdentifier"])
                            continue
                        inc = {}
                        loc = siteHash[w["StationIdentifier"]]
                        area = util.LatToArea(loc["lat"])
                        v = 0
                        if w["WaterLevel"] > loc["AlertLevel3"]:
                            v = 1
                        if w["WaterLevel"] > loc["AlertLevel2"]:
                            v = 2
                        if w["WaterLevel"] > loc["AlertLevel1"]:
                            v = 3
                        inc[area+"Sum"] = v
                        inc[area+"Num"] = 1
                        
                        tday = datetime.datetime.strptime(day, "%Y%m%d")
                        t10min = w["RecordTime"].replace(minute=(w["RecordTime"].minute-w["RecordTime"].minute%10),second=0)
                        self.db["waterLevelDailySum"].update({"time":tday},{"$inc":inc},upsert=True)
                        self.db["waterLevel10minSum"].update({"time":t10min},{"$inc":inc},upsert=True)
                    
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessReservoir(self,file):
        print("process file %s" % file)
        try:
            #map site info from id
            attr = {"id":1,"lat":1,"lng":1,"EffectiveCapacity":1}
            cursor = self.db["reservoirInfo"].find({},attr)
            siteHash = {}
            for site in cursor:
                siteHash[site["id"]] = site
                
            with open(file,"r",encoding="utf8") as f:
                data = f.read()
                reservoir = json.loads(data)
                for r in reservoir["ReservoirConditionData_OPENDATA"]:
                    day = (r["ObservationTime"].split("T")[0]).replace("-","")
                    key = {"ReservoirIdentifier":r["ReservoirIdentifier"],"ObservationTime":r["ObservationTime"]}
                    query = self.db["reservoir"+day].find_one(key)
                    if query is None:
                        data = {}
                        data["ReservoirIdentifier"] = r["ReservoirIdentifier"]
                        data["WaterLevel"] = util.ToFloat(r["WaterLevel"])
                        t = datetime.datetime.strptime(r["ObservationTime"], "%Y-%m-%dT%H:%M:%S")
                        data["ObservationTime"] = t
                        data["EffectiveWaterStorageCapacity"] = util.ToFloat(r["EffectiveWaterStorageCapacity"])
                        self.db["reservoir"+day].insert_one(data)
                        
                        #計算北中南蓄水百分比
                        if r["ReservoirIdentifier"] not in siteHash:
                            #print("reservoir %s not found" % r["ReservoirIdentifier"])
                            continue
                        
                        inc = {}
                        loc = siteHash[r["ReservoirIdentifier"]]
                        area = util.LatToArea(loc["lat"])
                        if data["EffectiveWaterStorageCapacity"] == "" or loc["EffectiveCapacity"] == "":
                            continue
                        inc[area+"Sum"] = util.ToFloat(data["EffectiveWaterStorageCapacity"])
                        inc[area+"Num"] = util.ToFloat(loc["EffectiveCapacity"])
                        tday = datetime.datetime.strptime(day, "%Y%m%d")
                        t10min = t.replace(minute=(t.minute-t.minute%10),second=0)
                        self.db["reservoirDailySum"].update({"time":tday},{"$inc":inc},upsert=True)
                        self.db["reservoirHourSum"].update({"time":t10min},{"$inc":inc},upsert=True)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessHistory(self):
        batchNum = 16
        folder = "data/waterLevel/"
        for i,filename in enumerate(os.listdir(folder)):
            self.ProcessWaterLevel(folder+filename)
            if i % batchNum == 0:
                print("garbage collection")
                gc.collect()
        
        folder = "data/reservoir/"
        for i,filename in enumerate(os.listdir(folder)):
            self.ProcessReservoir(folder+filename)
            if i % batchNum == 0:
                print("garbage collection")
                gc.collect()
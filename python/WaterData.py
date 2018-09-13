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
            t = now.strftime("%Y-%m-%d_%H-M")
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
                    site["AlertLevel1"] = d["AlertLevel1"]
                    site["AlertLevel2"] = d["AlertLevel2"]
                    site["AlertLevel3"] = d["AlertLevel3"]
                    site["LocationAddress"] = d["LocationAddress"]
                    loc = d["LocationByTWD97_XY"].split(" ")
                    lat,lon = util.TW97ToLatLng(float(loc[0]),float(loc[1]))
                    site["lat"] = lat
                    site["lon"] = lon
                    site["ObservatoryName"] = d["ObservatoryName"].strip()
                    site["RiverName"] = d["RiverName"]
                    site["Town"] = d["Town"]
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
                    r["id"] = s["id"]
                    r["lat"] = s["lat"]
                    r["lng"] = s["lng"]
                    r["DeadStorageLevel"] = s["DeadStorageLevel"]
                    r["EffectiveCapacity"] = s["EffectiveCapacity"]
                    r["FullWaterLevel"] = s["FullWaterLevel"]
                    key = {"ReservoirName":r["ReservoirName"],"Year":r["Year"]}
                    self.db["reservoirInfo"].update(key,r,upsert=True)
                    
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
    
    def ProcessWaterLevel(self,file):
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
                    key = {"StationIdentifier":w["StationIdentifier"],"RecordTime":w["RecordTime"]}
                    query = self.db["waterLevel"+day].find_one(key)
                    if query is None:
                        self.db["waterLevel"+day].insert_one(w)
                    
                        #計算北中南平均警戒程度
                        if w["StationIdentifier"] not in siteHash:
                            print("water level site %s not found" % w["StationIdentifier"])
                            continue
                        inc = {}
                        loc = siteHash[w["StationIdentifier"]]
                        area = util.LatToArea(loc["lat"])
                        v = 0
                        if loc["AlertLevel3"] != "" and w["WaterLevel"] > loc["AlertLevel3"]:
                            v = 1
                        if loc["AlertLevel2"] != "" and w["WaterLevel"] > loc["AlertLevel2"]:
                            v = 2
                        if loc["AlertLevel1"] != "" and w["WaterLevel"] > loc["AlertLevel1"]:
                            v = 3
                        inc[area+"Sum"] = v
                        inc[area+"Num"] = 1
                        self.db["waterLevelDailySum"].update({"time":day},{"$inc":inc},upsert=True)
                    
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessReservoir(self,file):
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
                        data["WaterLevel"] = r["WaterLevel"]
                        data["ObservationTime"] = r["ObservationTime"]
                        data["EffectiveWaterStorageCapacity"] = r["EffectiveWaterStorageCapacity"]
                        self.db["reservoir"+day].insert_one(data)
                        
                        #計算北中南蓄水百分比
                        if r["ReservoirIdentifier"] not in siteHash:
                            print("reservoir %s not found" % r["ReservoirIdentifier"])
                            continue
                        
                        inc = {}
                        loc = siteHash[r["ReservoirIdentifier"]]
                        area = util.LatToArea(loc["lat"])
                        if data["EffectiveWaterStorageCapacity"] == "" or loc["EffectiveCapacity"] == "":
                            continue
                        inc[area+"Sum"] = float(data["EffectiveWaterStorageCapacity"])
                        inc[area+"Num"] = float(loc["EffectiveCapacity"])
                        self.db["reservoirDailySum"].update({"time":day},{"$inc":inc},upsert=True)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
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
import ssl
from bs4 import BeautifulSoup
import math
from GridData import GridData
import pytz
import pymongo
#using Asia/Taipei will cause offset to be +0806
#taiwan = pytz.timezone('Asia/Taipei')
taiwan = datetime.timezone(offset = datetime.timedelta(hours = 8))

ssl._create_default_https_context = ssl._create_unverified_context

class WaterData:
    def __init__(self, db):
        self.db = db
        self.grid = GridData(db)
            
    def Init(self):
        self.AddWaterLevelSite()
        self.AddWaterLevelSiteTaipei()
        self.AddReservoirSite()
        self.AddSewerSite()
        self.AddPumpSite()
        
            
    def CollectData10min(self):
        try:
            print("collect water data 10min")
            now = datetime.datetime.now()
            now = now.replace(minute=(now.minute-now.minute%10))
            t = now.strftime("%Y-%m-%d_%H-%M")
            #water level
            """
            url = "https://data.wra.gov.tw/Service/OpenData.aspx?format=json&id=2D09DB8B-6A1B-485E-88B5-923A462F475C"
            folder = "data/waterLevel/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"waterLevel_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessWaterLevel(file)
            """

            #collect water level from fhy website for more real time data
            self.ProcessWaterLevelFromWebsite()
            self.ProcessWaterLevelTaipei()
            self.ProcessSewerData()
            self.ProcessPumpData()

            self.ProcessFlood("https://sta.ci.taiwan.gov.tw/STA_WaterResource_v2/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations($orderby=phenomenonTime%20desc;$top=1)%20&$filter=substringof(%27Datastream_Category_type=%E6%B7%B9%E6%B0%B4%E6%84%9F%E6%B8%AC%E5%99%A8%27,Datastreams/description)%20and%20substringof(%27Datastream_Category=%E6%B7%B9%E6%B0%B4%E6%B7%B1%E5%BA%A6%27,Datastreams/description)%20&$count=true")
            self.ProcessWaterLevel("https://sta.ci.taiwan.gov.tw/STA_WaterResource_v2/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations($orderby=phenomenonTime%20desc;$top=1)%20&$filter=Thing/properties/authority_type%20eq%20%27%E6%B0%B4%E5%88%A9%E7%BD%B2%27%20%20and%20substringof(%27Datastream_Category_type=%E6%B2%B3%E5%B7%9D%E6%B0%B4%E4%BD%8D%E7%AB%99%27,Datastreams/description)&$count=true")

            self.ProcessWaterLevelDrain("https://sta.ci.taiwan.gov.tw/STA_WaterResource_v2/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations($orderby=phenomenonTime%20desc;$top=1)%20&$filter=Thing/properties/authority_type%20eq%20%27%E6%B0%B4%E5%88%A9%E7%BD%B2%EF%BC%88%E8%88%87%E7%B8%A3%E5%B8%82%E6%94%BF%E5%BA%9C%E5%90%88%E5%BB%BA%EF%BC%89%27%20%20and%20substringof(%27Datastream_Category_type=%E5%8D%80%E5%9F%9F%E6%8E%92%E6%B0%B4%E6%B0%B4%E4%BD%8D%E7%AB%99%27,Datastreams/description)&$count=true")
            self.ProcessWaterLevelAgri("https://sta.ci.taiwan.gov.tw/STA_WaterResource_v2/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations($orderby=phenomenonTime%20desc;$top=1)%20&$filter=Thing/properties/authority_type%20eq%20%27%E8%BE%B2%E5%A7%94%E6%9C%83%27%20%20and%20substringof(%27Datastream_Category_type=%E8%BE%B2%E7%94%B0%E7%81%8C%E6%BA%89%E5%9C%B3%E8%B7%AF%E6%B0%B4%E4%BD%8D%E7%AB%99%27,Datastreams/description)&$count=true")
            self.ProcessWaterLevelAgri("https://sta.ci.taiwan.gov.tw/STA_WaterResource_v2/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations($orderby=phenomenonTime%20desc;$top=1)%20&$filter=Thing/properties/authority_type%20eq%20%27%E8%BE%B2%E5%A7%94%E6%9C%83%27%20%20and%20substringof(%27Datastream_Category_type=%E5%9F%A4%E5%A1%98%E6%B0%B4%E4%BD%8D%E7%AB%99%27,Datastreams/description)&$count=true")
            self.ProcessWaterLevelGate("https://sta.ci.taiwan.gov.tw/STA_WaterResource/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations($orderby=phenomenonTime%20desc;$top=1)%20&$filter=substringof(%27%E9%96%98%E9%96%80%27,Thing/properties/StationType)%20&$count=true")
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
            """folder = "data/reservoir/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"reservoir_"+t+".json"
            urllib.request.urlretrieve(url, file)"""
            self.ProcessReservoir(url)

            self.ProcessReservoirFromWebsite()
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
            r = requests.get(url,verify=False)
            r.encoding = "utf-8-sig"
            if r.status_code == requests.codes.all_okay:
                data = json.loads(r.text)
                ops = []
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
                    if len(loc) < 2:
                        continue
                    lat,lon = util.TW97ToLatLng(float(loc[0]),float(loc[1]))
                    site["lat"] = lat
                    site["lon"] = lon
                    site["ObservatoryName"] = d["ObservatoryName"].strip()
                    site["RiverName"] = d["RiverName"]
                    site["TownIdentifier"] = d["TownIdentifier"]
                    
                    key = {"BasinIdentifier":d["BasinIdentifier"]}
                    #self.db["waterLevelStation"].update(key,site,upsert=True)
                    ops.append(pymongo.UpdateOne(key, {"$set": site}, upsert=True))
                if len(ops) > 0:
                    self.db["waterLevelStation"].bulk_write(ops,ordered=False)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def AddWaterLevelSiteTaipei(self):
        try:
            print("add water level sites taipei")
            #water level sites
            url = "https://data.taipei/api/v1/dataset/98fce0a1-66f9-4b10-b384-1e80a7999e27?scope=resourceAquire&limit=100"
            r = requests.get(url)
            if r.status_code == requests.codes.all_okay:
                data = r.json()["result"]
                ops = []
                for d in data["results"]:
                    site = {}
                    site["BasinIdentifier"] = d["站碼"].zfill(3)
                    site["lat"] = util.ToFloat(d["Y座標"])
                    site["lon"] = util.ToFloat(d["X座標"])
                    site["ObservatoryName"] = d["站名"]
                    site["stationName"] = d["站名"]
                    key = {"BasinIdentifier":d["站碼"]}
                    #print(site)
                    ops.append(pymongo.UpdateOne(key, {"$set": site}, upsert=True))
                if len(ops) > 0:
                    self.db["waterLevelStation"].bulk_write(ops,ordered=False)
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
                ops = []
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
                    #self.db["reservoirInfo"].update(key,r,upsert=True)
                    ops.append(pymongo.UpdateOne(key, {"$set": r}, upsert=True))
                if len(ops) > 0:
                    self.db["reservoirInfo"].bulk_write(ops,ordered=False)
                    
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def AddSewerSite(self):
        try:
            print("add sewer sites")
            #water level sites
            url = "http://ipgod.nchc.org.tw/dataset/0f140b04-e04f-4b03-8706-21c03dfa0989/resource/e4a22c5c-859c-4a5a-b3e7-3f7323524856/download/70eb2f32ed6de9adbceb2b983bcae5f4.kml"
            r = requests.get(url,verify=False)
            r.encoding = "utf-8-sig"
            if r.status_code == requests.codes.all_okay:
                soup = BeautifulSoup(r.text, "xml")
                placeArr = soup.Folder.find_all("Placemark")
                ops = []
                for place in placeArr:
                    coord = place.find("coordinates").string.split(",")
                    site = {}
                    site["lat"] = util.ToFloat(coord[1])
                    site["lng"] = util.ToFloat(coord[0])

                    data = place.find_all("SimpleData")
                    for d in data:
                        name = d.get("name")
                        if name == "ST_NO":
                            site["no"] = d.string
                        elif name == "DISTRICT":
                            site["district"] = d.string
                        elif name == "VILLAGE":
                            site["village"] = d.string
                        elif name == "REGION":
                            site["region"] = d.string
                        elif name == "ST_NAME":
                            site["name"] = d.string
                        elif name == "ST_ADDRESS":
                            site["address"] = d.string
                    key = {"no":site["no"]}
                    #self.db["sewerStation"].update(key,site,upsert=True)
                    ops.append(pymongo.UpdateOne(key, {"$set": site}, upsert=True))
                if len(ops) > 0:
                    self.db["sewerStation"].bulk_write(ops,ordered=False)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def AddPumpSite(self):
        try:
            print("add pump sites")
            url = "https://data.taipei/api/getDatasetInfo/downloadResource?id=b2f7eeba-34a2-4239-a434-ea7986b2bb12&rid=90441775-dda1-461c-8424-9dae7a8ab776"
            r = requests.get(url)
            r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                soup = BeautifulSoup(r.text, "xml")
                placeArr = soup.Folder.find_all("Placemark")
                ops = []
                for place in placeArr:
                    coord = place.find("coordinates").string.split(",")
                    site = {}
                    site["lat"] = util.ToFloat(coord[1])
                    site["lng"] = util.ToFloat(coord[0])

                    data = place.find_all("SimpleData")
                    for d in data:
                        name = d.get("name")
                        if name == "PUMP_ID":
                            site["id"] = d.string
                        elif name == "行政區域":
                            site["district"] = d.string
                        elif name == "河系":
                            site["system"] = d.string
                        elif name == "管理單位別":
                            site["admin"] = d.string
                        elif name == "站名":
                            site["name"] = d.string
                        elif name == "建置年度":
                            site["buildDate"] = d.string
                    key = {"id":site["id"]}
                    #self.db["sewerStation"].update(key,site,upsert=True)
                    ops.append(pymongo.UpdateOne(key, {"$set": site}, upsert=True))
                if len(ops) > 0:
                    self.db["pumpStation"].bulk_write(ops,ordered=False)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
    
    """def ProcessWaterLevel(self,file):
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
                    t = datetime.datetime.strptime(w["RecordTime"]+"+0800", "%Y-%m-%dT%H:%M:%S%z")
                    w["RecordTime"] = t
                    w["WaterLevel"] = util.ToFloat(w["WaterLevel"])
                    if math.isnan(w["WaterLevel"]) or w["WaterLevel"] < 0:
                        continue
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
    """
    def ProcessWaterLevel(self, url):
        print("process water level url: "+url)
        try:
            r = requests.get(url,verify=False)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["value"]
                #add site
                ops = []
                for d in data:
                    if len(d["Thing"]["Locations"]) == 0:
                        continue
                    prop = d["Thing"]["properties"]
                    #basin = prop["basin"]
                    site = {}
                    site["BasinIdentifier"] = prop["stationCode"]
                    #site["AffiliatedBasin"] = basin["AffiliatedBasin"]
                    #site["AffiliatedSubsidiaryBasin"] = basin["AffiliatedSubsidiaryBasin"]
                    #site["AffiliatedSubSubsidiaryBasin"] = basin["AffiliatedSubSubsidiaryBasin"]
                    if "AlertLevel1" in prop:
                        site["AlertLevel1"] = util.ToFloat(prop["AlertLevel1"])
                    if "AlertLevel2" in prop:
                        site["AlertLevel2"] = util.ToFloat(prop["AlertLevel2"])
                    if "AlertLevel3" in prop:
                        site["AlertLevel3"] = util.ToFloat(prop["AlertLevel3"])
                    loc = d["Thing"]["Locations"][0]["location"]["coordinates"]
                    site["lat"] = loc[1]
                    site["lon"] = loc[0]
                    site["ObservatoryName"] = d["Thing"]["name"]
                    #site["RiverName"] = prop["RiverName"]
                    site["stationName"] = prop["stationName"]
                    #site["TownIdentifier"] = prop["TownIdentifier"]
                    
                    key = {"BasinIdentifier":site["BasinIdentifier"]}
                    #self.db["waterLevelStation"].update(key,site,upsert=True)
                    ops.append(pymongo.UpdateOne(key, {"$set": site}, upsert=True))
                if len(ops) > 0:
                    self.db["waterLevelStation"].bulk_write(ops,ordered=False)

                #add data
                ops = {}
                gridArr = {}
                for d in data:
                    if len(d["Observations"]) == 0:
                        continue
                    prop = d["Thing"]["properties"]
                    w = {}
                    w["StationIdentifier"] = prop["stationCode"]
                    t = datetime.datetime.strptime(d["Observations"][0]["phenomenonTime"],'%Y-%m-%dT%H:%M:%S.%fZ')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)
                    w["RecordTime"] = t
                    w["WaterLevel"] = d["Observations"][0]["result"]
                    key = {"StationIdentifier":w["StationIdentifier"],"RecordTime":w["RecordTime"]}
                    day = datetime.datetime.strftime(t,"%Y%m%d")
                    query = self.db["waterLevel"+day].find_one(key)
                    if query is None:
                        #self.db["waterLevel"+day].insert_one(w)
                        if not day in ops:
                            ops[day] = []
                        ops[day].append(pymongo.UpdateOne(key, {"$set": w}, upsert=True))

                        loc = d["Thing"]["Locations"][0]["location"]["coordinates"]
                        grid = w.copy()
                        grid["lat"] = loc[1]
                        grid["lon"] = loc[0]
                        #self.grid.AddGridWaterLevel(w)
                        if not day in gridArr:
                            gridArr[day] = []
                        gridArr[day].append(grid)

                for key in ops:
                    self.db["waterLevel"+key].create_index("RecordTime")
                    self.db["waterLevel"+key].create_index("StationIdentifier")
                    if len(ops[key]) > 0:
                        self.db["waterLevel"+key].bulk_write(ops[key],ordered=False)
                    #self.grid.AddGridBatch("waterLevelGrid"+key,gridArr[key],"RecordTime",["WaterLevel"],"lat","lon")

                if "@iot.nextLink" in result:
                    self.ProcessWaterLevel(result["@iot.nextLink"])
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessWaterLevelFromWebsite(self):
        try:
            #map site info from name
            attr = {"BasinIdentifier":1,"ObservatoryName":1,"lat":1,"lon":1,"AlertLevel1":1,"AlertLevel2":1,"AlertLevel3":1}
            cursor = self.db["waterLevelStation"].find({},attr)
            siteHash = {}
            for site in cursor:
                id = site["BasinIdentifier"]
                siteHash[id] = site

            r = requests.get("https://fhyv.wra.gov.tw/FhyWeb/v1/Api/WaterLevel/RealTimeInfo/Basin/%E5%85%A8%E6%B5%81%E5%9F%9F?$format=JSON")
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                #print(r.text)
                ops = {}
                gridArr = {}
                for d in r.json():
                    w = {}
                    if "WaterLevel" not in d:
                        continue
                    w["WaterLevel"] = util.ToFloat(d["WaterLevel"])
                    if math.isnan(w["WaterLevel"]) or w["WaterLevel"] < 0:
                        continue
                    t = datetime.datetime.strptime(d["Time"],'%Y-%m-%dT%H:%M:%S+00:00')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)
                    w["RecordTime"] = t
                    w["StationIdentifier"] = d["StationNo"]
                    key = {"StationIdentifier":w["StationIdentifier"],"RecordTime":t}
                    day = datetime.datetime.strftime(t, "%Y%m%d")

                    query = self.db["waterLevel"+day].find_one(key)
                    if query is None:
                        #self.db["waterLevel"+day].insert_one(w)
                        if not day in ops:
                            ops[day] = []
                        ops[day].append(pymongo.UpdateOne(key, {"$set": w}, upsert=True))

                        if d["StationNo"] not in siteHash:
                            continue
                        loc = siteHash[d["StationNo"]]
                        grid = w.copy()
                        grid["lat"] = loc["lat"]
                        grid["lon"] = loc["lon"]
                        #self.grid.AddGridWaterLevel(w)
                        if not day in gridArr:
                            gridArr[day] = []
                        gridArr[day].append(grid)
                    
                        #計算北中南平均警戒程度
                        """inc = {}
                        loc = siteHash[name]
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
                        
                        self.db["waterLevelDailySum"].update({"time":tday},{"$inc":inc},upsert=True)
                        self.db["waterLevel10minSum"].update({"time":t10min},{"$inc":inc},upsert=True)"""
                for key in ops:
                    self.db["waterLevel"+key].create_index("RecordTime")
                    self.db["waterLevel"+key].create_index("StationIdentifier")
                    if len(ops[key]) > 0:
                        self.db["waterLevel"+key].bulk_write(ops[key],ordered=False)
                    #self.grid.AddGridBatch("waterLevelGrid"+key,gridArr[key],"RecordTime",["WaterLevel"],"lat","lon")
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessWaterLevelTaipei(self):
        try:
            #map site info from name
            attr = {"BasinIdentifier":1,"ObservatoryName":1,"lat":1,"lon":1,"AlertLevel1":1,"AlertLevel2":1,"AlertLevel3":1}
            cursor = self.db["waterLevelStation"].find({},attr)
            siteHash = {}
            for site in cursor:
                id = site["BasinIdentifier"]
                siteHash[id] = site

            r = requests.get("https://wic.heo.taipei/OpenData/API/Water/Get?stationNo=&loginId=river&dataKey=9E2648AA")
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                #print(r.text)
                ops = {}
                gridArr = {}
                for d in r.json()["data"]:
                    w = {}
                    if "levelOut" not in d:
                        continue
                    w["WaterLevel"] = util.ToFloat(d["levelOut"])
                    if math.isnan(w["WaterLevel"]) or w["WaterLevel"] < 0:
                        continue
                    t = datetime.datetime.strptime(d["recTime"],'%Y%m%d%H%M')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=taiwan)
                    w["RecordTime"] = t
                    w["StationIdentifier"] = d["stationNo"]
                    key = {"StationIdentifier":w["StationIdentifier"],"RecordTime":t}
                    day = datetime.datetime.strftime(t, "%Y%m%d")
                    print(w)

                    query = self.db["waterLevel"+day].find_one(key)
                    if query is None:
                        #self.db["waterLevel"+day].insert_one(w)
                        if not day in ops:
                            ops[day] = []
                        ops[day].append(pymongo.UpdateOne(key, {"$set": w}, upsert=True))

                        if d["stationNo"] not in siteHash:
                            continue
                        loc = siteHash[d["stationNo"]]
                        grid = w.copy()
                        grid["lat"] = loc["lat"]
                        grid["lon"] = loc["lon"]
                        #self.grid.AddGridWaterLevel(w)
                        if not day in gridArr:
                            gridArr[day] = []
                        gridArr[day].append(grid)
                for key in ops:
                    self.db["waterLevel"+key].create_index("RecordTime")
                    self.db["waterLevel"+key].create_index("StationIdentifier")
                    if len(ops[key]) > 0:
                        self.db["waterLevel"+key].bulk_write(ops[key],ordered=False)
                    #self.grid.AddGridBatch("waterLevelGrid"+key,gridArr[key],"RecordTime",["WaterLevel"],"lat","lon")
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessFlood(self, url):
        print("process flood url: "+url)
        try:
            r = requests.get(url,verify=False)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["value"]
                #add site
                ops = []
                for d in data:
                    if len(d["Thing"]["Locations"]) == 0:
                        continue
                    s = {}
                    s["_id"] = d["Thing"]["name"]
                    s["stationName"] = d["Thing"]["properties"]["stationName"]
                    
                    #有些站有多個location，某些location裡面沒座標
                    hasLoc = False
                    for loc in d["Thing"]["Locations"]:
                        if loc["location"]["type"] == "Point":
                            coord = loc["location"]["coordinates"]
                            s["lat"] = coord[1]
                            s["lng"] = coord[0]
                            hasLoc = True
                            break
                    if hasLoc:
                        #self.db["floodSite"].update({"_id":s["_id"]},s,upsert=True)
                        ops.append(pymongo.UpdateOne({"_id":s["_id"]}, {"$set": s}, upsert=True))
                if len(ops) > 0:
                    self.db["floodSite"].bulk_write(ops,ordered=False)

                #add data
                ops = {}
                for d in data:
                    if d["name"] != "淹水深度":
                        continue
                    if len(d["Observations"]) == 0:
                        continue
                    f = {}
                    f["stationID"] = d["Thing"]["name"]
                    t = datetime.datetime.strptime(d["Observations"][0]["phenomenonTime"],'%Y-%m-%dT%H:%M:%S.%fZ')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)
                    f["time"] = t
                    f["value"] = d["Observations"][0]["result"]
                    key = {"stationID":f["stationID"],"time":f["time"]}
                    day = datetime.datetime.strftime(t,"%Y%m%d")
                    query = self.db["flood"+day].find_one(key)
                    if query is None:
                        #self.db["flood"+day].insert_one(f)
                        if not day in ops:
                            ops[day] = []
                        ops[day].append(pymongo.UpdateOne(key, {"$set": f}, upsert=True))
                for key in ops:
                    if len(ops[key]) > 0:
                        self.db["flood"+key].bulk_write(ops[key],ordered=False)

                if "@iot.nextLink" in result:
                    self.ProcessFlood(result["@iot.nextLink"])
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessReservoir(self,url):
        print("process reservoir url: "+url)
        try:
            #map site info from id
            attr = {"id":1,"lat":1,"lng":1,"EffectiveCapacity":1}
            cursor = self.db["reservoirInfo"].find({},attr)
            siteHash = {}
            for site in cursor:
                siteHash[site["id"]] = site
                
            r = requests.get(url,verify=False)
            r.encoding = "utf-8-sig"
            if r.status_code == requests.codes.all_okay:
                reservoir = r.json()
                ops = {}
                for r in reservoir["ReservoirConditionData_OPENDATA"]:
                    day = (r["ObservationTime"].split("T")[0]).replace("-","")
                    key = {"ReservoirIdentifier":r["ReservoirIdentifier"],"ObservationTime":r["ObservationTime"]}
                    query = self.db["reservoir"+day].find_one(key)
                    if query is None:
                        data = {}
                        data["ReservoirIdentifier"] = r["ReservoirIdentifier"]
                        data["WaterLevel"] = util.ToFloat(r["WaterLevel"])
                        if math.isnan(data["WaterLevel"]) or data["WaterLevel"] < 0:
                            continue
                        t = datetime.datetime.strptime(r["ObservationTime"], "%Y-%m-%dT%H:%M:%S")
                        t = t.replace(tzinfo=taiwan)
                        data["ObservationTime"] = t
                        data["EffectiveWaterStorageCapacity"] = util.ToFloat(r["EffectiveWaterStorageCapacity"])
                        if math.isnan(data["EffectiveWaterStorageCapacity"]) or data["EffectiveWaterStorageCapacity"] < 0:
                            continue
                        #self.db["reservoir"+day].insert_one(data)
                        key = {"ReservoirIdentifier":data["ReservoirIdentifier"],"ObservationTime":data["ObservationTime"]}
                        if not day in ops:
                            ops[day] = []
                        ops[day].append(pymongo.UpdateOne(key, {"$set": data}, upsert=True))
                        
                        #計算北中南蓄水百分比
                        """if r["ReservoirIdentifier"] not in siteHash:
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
                        self.db["reservoirHourSum"].update({"time":t10min},{"$inc":inc},upsert=True)"""
                for key in ops:
                    if len(ops[key]) > 0:
                        self.db["reservoir"+key].bulk_write(ops[key],ordered=False)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessReservoirFromWebsite(self):
        print("process reservoir from website")
        try:
            #map site info from name
            attr = {"id":1,"ReservoirName":1}
            cursor = self.db["reservoirInfo"].find({},attr)
            siteHash = {}
            for site in cursor:
                siteHash[site["ReservoirName"]] = site

            r = requests.get("https://fhy.wra.gov.tw/ReservoirPage_2011/Statistics.aspx")
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                #print(r.text)
                soup = BeautifulSoup(r.text, 'html.parser')
                tr = soup.find_all('tr')
                ops = {}
                for i in range(2,len(tr)):
                    td = tr[i].find_all("td")
                    if(len(td) < 7):
                        continue
                    day = (td[1].string.split(" ")[0]).replace("-","")
                    data = {}
                    reservoirName = td[0].find_all('a')[0].string
                    if not reservoirName in siteHash:
                        continue
                    if td[1].string == "--":
                        continue
                    if util.ToFloat(td[4].string) < 0:
                        continue
                    data["ReservoirIdentifier"] = siteHash[reservoirName]["id"]
                    t = datetime.datetime.strptime(td[1].string, "%Y-%m-%d %H:%M:%S")
                    t = t.replace(tzinfo=taiwan)
                    data["ObservationTime"] = t
                    key = {"ReservoirIdentifier":data["ReservoirIdentifier"],"ObservationTime":data["ObservationTime"]}
                    query = self.db["reservoir"+day].find_one(key)
                    if query is None:
                        data["WaterLevel"] = util.ToFloat(td[4].string)
                        if math.isnan(data["WaterLevel"]) or data["WaterLevel"] < 0:
                            continue
                        data["EffectiveWaterStorageCapacity"] = util.ToFloat(td[6].string)
                        if math.isnan(data["EffectiveWaterStorageCapacity"]) or data["EffectiveWaterStorageCapacity"] < 0:
                            continue
                        #self.db["reservoir"+day].insert_one(data)
                        if not day in ops:
                            ops[day] = []
                        ops[day].append(pymongo.UpdateOne(key, {"$set": data}, upsert=True))
                for key in ops:
                    if len(ops[key]) > 0:
                        self.db["reservoir"+key].bulk_write(ops[key],ordered=False)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessWaterLevelDrain(self, url):
        print("process water level drain url: "+url)
        try:
            r = requests.get(url,verify=False)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["value"]
                #add site
                ops = []
                for d in data:
                    if len(d["Thing"]["Locations"]) == 0:
                        continue
                    s = {}
                    s["_id"] = d["Thing"]["name"]
                    s["stationName"] = d["Thing"]["properties"]["stationName"]
                    coord = d["Thing"]["Locations"][0]["location"]["coordinates"]
                    s["lat"] = coord[1]
                    s["lng"] = coord[0]
                    #self.db["waterLevelDrainSite"].update({"_id":s["_id"]},s,upsert=True)
                    ops.append(pymongo.UpdateOne({"_id":s["_id"]}, {"$set": s}, upsert=True))
                if len(ops) > 0:
                    self.db["waterLevelDrainSite"].bulk_write(ops,ordered=False)

                #add data
                ops = {}
                gridArr = {}
                for d in data:
                    if not "水位" in d["name"]:
                        continue
                    if len(d["Observations"]) == 0:
                        continue
                    f = {}
                    f["stationID"] = d["Thing"]["name"]
                    t = datetime.datetime.strptime(d["Observations"][0]["phenomenonTime"],'%Y-%m-%dT%H:%M:%S.%fZ')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)
                    f["time"] = t
                    f["value"] = d["Observations"][0]["result"]
                    key = {"stationID":f["stationID"],"time":f["time"]}
                    day = datetime.datetime.strftime(t,"%Y%m%d")
                    query = self.db["waterLevelDrain"+day].find_one(key)
                    if query is None:
                        #self.db["waterLevelDrain"+day].insert_one(f)
                        if day not in ops:
                            ops[day] = []
                        ops[day].append(pymongo.UpdateOne(key, {"$set": f}, upsert=True))

                        loc = d["Thing"]["Locations"][0]["location"]["coordinates"]
                        grid = f.copy()
                        grid["lat"] = loc[1]
                        grid["lng"] = loc[0]
                        #self.grid.AddGridWaterLevelDrain(f)
                        if day not in gridArr:
                            gridArr[day] = []
                        gridArr[day].append(grid)

                for key in ops:
                    self.db["waterLevelDrain"+key].create_index("time")
                    self.db["waterLevelDrain"+key].create_index("stationID")
                    if len(ops[key]) > 0:
                        self.db["waterLevelDrain"+key].bulk_write(ops[key],ordered=False)
                    #self.grid.AddGridBatch("waterLevelDrainGrid"+key,gridArr[key],"time",["value"],"lat","lng")

                if "@iot.nextLink" in result:
                    self.ProcessWaterLevelDrain(result["@iot.nextLink"])
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessWaterLevelAgri(self, url):
        print("process water level agriculture url: "+url)
        try:
            r = requests.get(url,verify=False)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["value"]
                #add site
                ops = []
                for d in data:
                    if len(d["Thing"]["Locations"]) == 0:
                        continue
                    s = {}
                    s["_id"] = d["Thing"]["name"]
                    s["stationName"] = d["Thing"]["properties"]["stationName"]
                    coord = d["Thing"]["Locations"][0]["location"]["coordinates"]
                    s["lat"] = coord[1]
                    s["lng"] = coord[0]
                    #self.db["waterLevelAgriSite"].update({"_id":s["_id"]},s,upsert=True)
                    ops.append(pymongo.UpdateOne({"_id":s["_id"]}, {"$set": s}, upsert=True))
                if len(ops) > 0:
                    self.db["waterLevelAgriSite"].bulk_write(ops,ordered=False)

                #add data
                ops = {}
                gridArr = {}
                for d in data:
                    if len(d["Observations"]) == 0:
                        continue
                    f = {}
                    f["stationID"] = d["Thing"]["name"]
                    t = datetime.datetime.strptime(d["Observations"][0]["phenomenonTime"],'%Y-%m-%dT%H:%M:%S.%fZ')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)
                    f["time"] = t
                    f["value."+d["name"]] = d["Observations"][0]["result"]
                    key = {"stationID":f["stationID"],"time":f["time"]}
                    day = datetime.datetime.strftime(t,"%Y%m%d")
                    query = self.db["waterLevelAgri"+day].find_one(key)
                    if query is None:
                        #self.db["waterLevelAgri"+day].insert_one(f)
                        if not day in ops:
                            ops[day] = []
                        ops[day].append(pymongo.UpdateOne(key, {"$set": f}, upsert=True))

                        coord = d["Thing"]["Locations"][0]["location"]["coordinates"]
                        grid = f.copy()
                        grid["lat"] = coord[1]
                        grid["lng"] = coord[0]
                        #self.grid.AddGridWaterLevelAgri(f)
                        if not day in gridArr:
                            gridArr[day] = []
                        gridArr[day].append(grid)

                for key in ops:
                    self.db["waterLevelAgri"+key].create_index("time")
                    self.db["waterLevelAgri"+key].create_index("stationID")
                    if len(ops[key]) > 0:
                        self.db["waterLevelAgri"+key].bulk_write(ops[key],ordered=False)
                    #self.grid.AddGridBatch("waterLevelAgriGrid"+key,gridArr[key],"time",["value"],"lat","lng")


                if "@iot.nextLink" in result:
                    self.ProcessWaterLevelAgri(result["@iot.nextLink"])
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessWaterLevelGate(self, url):
        print("process water level gate url: "+url)
        try:
            r = requests.get(url,verify=False)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["value"]
                #add site
                ops = []
                for d in data:
                    if len(d["Thing"]["Locations"]) == 0:
                        continue
                    s = {}
                    s["_id"] = d["Thing"]["name"]
                    s["stationName"] = d["Thing"]["properties"]["stationName"]
                    coord = d["Thing"]["Locations"][0]["location"]["coordinates"]
                    s["lat"] = coord[1]
                    s["lng"] = coord[0]
                    #self.db["waterLevelGateSite"].update({"_id":s["_id"]},s,upsert=True)
                    ops.append(pymongo.UpdateOne({"_id":s["_id"]}, {"$set": s}, upsert=True))
                if len(ops) > 0:
                    self.db["waterLevelGateSite"].bulk_write(ops,ordered=False)

                #add data
                ops = {}
                for d in data:
                    if len(d["Observations"]) == 0:
                        continue
                    f = {}
                    f["stationID"] = d["Thing"]["name"]
                    t = datetime.datetime.strptime(d["Observations"][0]["phenomenonTime"],'%Y-%m-%dT%H:%M:%S.%fZ')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)

                    f["time"] = t
                    f["value."+d["name"]] = d["Observations"][0]["result"]
                    key = {"stationID":f["stationID"],"time":f["time"]}
                    day = datetime.datetime.strftime(t,"%Y%m%d")

                    #self.db["waterLevelGate"+day].update(key,{"$set":f},upsert=True)
                    if not day in ops:
                        ops[day] = []
                    ops[day].append(pymongo.UpdateOne(key,{"$set":f},upsert=True))
                for key in ops:
                    if len(ops[key]) > 0:
                        self.db["waterLevelGate"+key].bulk_write(ops[key],ordered=False)

                if "@iot.nextLink" in result:
                    self.ProcessWaterLevelGate(result["@iot.nextLink"])
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessSewerData(self):
        print("process sewer data")
        try:
            r = requests.get("https://wic.heo.taipei/OpenData/API/Sewer/Get?stationNo=&loginId=sewer01&dataKey=BD3E513A")
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["data"]

                cursor = self.db["sewerStation"].find({})
                siteHash = {}
                for site in cursor:
                    siteHash[site["no"]] = site
                
                ops = {}
                gridArr = {}
                for d in data:
                    f = {}
                    f["stationNo"] = d["stationNo"]
                    t = datetime.datetime.strptime(d["recTime"],'%Y%m%d%H%M')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=taiwan)
                    f["time"] = t
                    f["value"] = d["levelOut"]
                    key = {"stationNo":f["stationNo"],"time":f["time"]}
                    day = datetime.datetime.strftime(t,"%Y%m%d")
                    query = self.db["sewer"+day].find_one(key)
                    if query is None:
                        #self.db["sewer"+day].insert_one(f)
                        if not day in ops:
                            ops[day] = []
                        ops[day].append(pymongo.UpdateOne(key, {"$set": f}, upsert=True))

                        if f["stationNo"] in siteHash:
                            s = siteHash[f["stationNo"]]
                            grid = f.copy()
                            grid["lat"] = s["lat"]
                            grid["lng"] = s["lng"]
                            #self.grid.AddGridSewer(f)
                            if day not in gridArr:
                                gridArr[day] = []
                            gridArr[day].append(grid)

                for key in ops:
                    self.db["sewer"+key].create_index("time")
                    self.db["sewer"+key].create_index("stationNo")
                    if len(ops[key]) > 0:
                        self.db["sewer"+key].bulk_write(ops[key],ordered=False)
                    #self.grid.AddGridBatch("sewerGrid"+key,gridArr[key],"time",["value"],"lat","lng")

        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessPumpData(self):
        print("process pump data")
        try:
            r = requests.get("https://wic.heo.taipei/OpenData/API/Pump/Get?stationNo=&loginId=pumping&dataKey=3D9A9570")
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["data"]

                cursor = self.db["pumpStation"].find({})
                siteHash = {}
                for site in cursor:
                    siteHash[site["id"]] = site
                
                ops = {}
                gridArr = {}
                for d in data:
                    f = {}
                    f["stationNo"] = d["stationNo"]
                    t = datetime.datetime.strptime(d["recTime"],'%Y%m%d%H%M')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=taiwan)
                    f["time"] = t
                    f["levelIn"] = d["levelIn"]
                    f["levelOut"] = d["levelOut"]
                    f["allPumbLights"] = d["allPumbLights"]
                    f["pumbNum"] = d["pumbNum"]
                    f["doorNum"] = d["doorNum"]
                    key = {"stationNo":f["stationNo"],"time":f["time"]}
                    day = datetime.datetime.strftime(t,"%Y%m%d")
                    query = self.db["pump"+day].find_one(key)
                    if query is None:
                        #self.db["pump"+day].insert_one(f)
                        if not day in ops:
                            ops[day] = []
                        ops[day].append(pymongo.UpdateOne(key, {"$set": f}, upsert=True))

                        if f["stationNo"] in siteHash:
                            s = siteHash[f["stationNo"]]
                            grid = f.copy()
                            grid["lat"] = s["lat"]
                            grid["lng"] = s["lng"]
                            if f["allPumbLights"] != "-":
                                grid["allPumbLights"] = 1
                            else:
                                grid["allPumbLights"] = 0
                            #self.grid.AddGridSewer(f)
                            if not day in gridArr:
                                gridArr[day] = []
                            gridArr[day].append(grid)

                for key in ops:
                    self.db["pump"+key].create_index("time")
                    self.db["pump"+key].create_index("stationNo")
                    if len(ops[key]) > 0:
                        self.db["pump"+key].bulk_write(ops[key],ordered=False)
                    #self.grid.AddGridBatch("pumpGrid"+key,gridArr[key],"time",["levelIn","levelOut","pumbNum","doorNum","allPumbLights"],"lat","lng")

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

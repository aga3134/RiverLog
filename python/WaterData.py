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
        self.AddReservoirSite()
        self.AddSewerSite()
            
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
            self.ProcessSewerData()

            self.ProcessFlood("https://sta.ci.taiwan.gov.tw/STA_WaterResource_lastest/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations($orderby=phenomenonTime%20desc;$top=1)%20&$filter=substringof(%27%E6%B7%B1%E5%BA%A6%27,Datastream/name)%20&$count=true")
            self.ProcessWaterLevel("https://sta.ci.taiwan.gov.tw/STA_WaterLevel_v2/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations($orderby=phenomenonTime%20desc;$top=1)&$count=true")

            self.ProcessWaterLevelDrain("https://sta.ci.taiwan.gov.tw/STA_WaterResource/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations($orderby=phenomenonTime%20desc;$top=1)%20&$filter=substringof(%27%E5%8D%80%E5%9F%9F%E6%8E%92%E6%B0%B4%E6%B0%B4%E4%BD%8D%27,Thing/properties/StationType)%20&$count=true")
            self.ProcessWaterLevelAgri("https://sta.ci.taiwan.gov.tw/STA_WaterResource/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations($orderby=phenomenonTime%20desc;$top=1)%20&$filter=substringof(%27%E6%B0%B4%E5%88%A9%E6%9C%83%27,Thing/properties/authority)%20&$count=true")
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
            folder = "data/reservoir/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"reservoir_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessReservoir(file)

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
                    self.db["sewerStation"].update(key,site,upsert=True)
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
            r = requests.get(url)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["value"]
                #add site
                for d in data:
                    if len(d["Thing"]["Locations"]) == 0:
                        continue
                    prop = d["Thing"]["properties"]
                    basin = prop["basin"]
                    site = {}
                    site["BasinIdentifier"] = prop["stationID"]
                    site["AffiliatedBasin"] = basin["AffiliatedBasin"]
                    site["AffiliatedSubsidiaryBasin"] = basin["AffiliatedSubsidiaryBasin"]
                    site["AffiliatedSubSubsidiaryBasin"] = basin["AffiliatedSubSubsidiaryBasin"]
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
                    site["RiverName"] = prop["RiverName"]
                    site["TownIdentifier"] = prop["TownIdentifier"]
                    
                    key = {"BasinIdentifier":site["BasinIdentifier"]}
                    self.db["waterLevelStation"].update(key,site,upsert=True)

                #add data
                for d in data:
                    if len(d["Observations"]) == 0:
                        continue
                    prop = d["Thing"]["properties"]
                    w = {}
                    w["StationIdentifier"] = prop["stationID"]
                    t = datetime.datetime.strptime(d["Observations"][0]["phenomenonTime"],'%Y-%m-%dT%H:%M:%S.%fZ')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)
                    w["RecordTime"] = t
                    w["WaterLevel"] = d["Observations"][0]["result"]
                    key = {"StationIdentifier":w["StationIdentifier"],"RecordTime":w["RecordTime"]}
                    day = datetime.datetime.strftime(t,"%Y%m%d")
                    query = self.db["waterLevel"+day].find_one(key)
                    if query is None:
                        self.db["waterLevel"+day].insert_one(w)

                        loc = d["Thing"]["Locations"][0]["location"]["coordinates"]
                        w["lat"] = loc[1]
                        w["lon"] = loc[0]
                        self.grid.AddGridWaterLevel(w)

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
                siteHash[site["ObservatoryName"]] = site

            now = datetime.datetime.now()
            utcnow = datetime.datetime.utcnow()
            tday = datetime.datetime.strftime(utcnow, "%Y%m%d")
            t10min = utcnow.replace(minute=(utcnow.minute-utcnow.minute%10),second=0,microsecond=0)

            r = requests.post("http://fhy.wra.gov.tw/fhy/Monitor/WaterInfo")
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                #print(r.text)
                soup = BeautifulSoup(r.text, 'html.parser')
                tr = soup.find_all('tr')
                for i in range(2,len(tr)):
                    td = tr[i].find_all("td")
                    name = td[2].string
                    if name not in siteHash:
                        continue
                    stationID = siteHash[name]["BasinIdentifier"]
                    w = {}
                    w["WaterLevel"] = util.ToFloat(td[4].string)
                    if math.isnan(w["WaterLevel"]) or w["WaterLevel"] < 0:
                        continue
                    w["RecordTime"] = t10min
                    w["StationIdentifier"] = stationID
                    key = {"StationIdentifier":w["StationIdentifier"],"RecordTime":t10min}
                    day = datetime.datetime.strftime(now, "%Y%m%d")

                    query = self.db["waterLevel"+day].find_one(key)
                    if query is None:
                        self.db["waterLevel"+day].insert_one(w)

                        loc = siteHash[name]
                        w["lat"] = loc["lat"]
                        w["lon"] = loc["lon"]
                        self.grid.AddGridWaterLevel(w)
                    
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
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessFlood(self, url):
        print("process flood url: "+url)
        try:
            r = requests.get(url)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["value"]
                #add site
                for d in data:
                    if len(d["Thing"]["Locations"]) == 0:
                        continue
                    s = {}
                    s["_id"] = d["Thing"]["name"]
                    s["stationName"] = d["Thing"]["properties"]["stationName"]
                    coord = d["Thing"]["Locations"][0]["location"]["coordinates"]
                    s["lat"] = coord[1]
                    s["lng"] = coord[0]
                    self.db["floodSite"].update({"_id":s["_id"]},s,upsert=True)
                #add data
                for d in data:
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
                        self.db["flood"+day].insert_one(f)

                if "@iot.nextLink" in result:
                    self.ProcessFlood(result["@iot.nextLink"])
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
                
            with open(file,"r",encoding="utf-8-sig") as f:
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
                        if math.isnan(data["WaterLevel"]) or data["WaterLevel"] < 0:
                            continue
                        t = datetime.datetime.strptime(r["ObservationTime"]+"+0800", "%Y-%m-%dT%H:%M:%S%z")
                        data["ObservationTime"] = t
                        data["EffectiveWaterStorageCapacity"] = util.ToFloat(r["EffectiveWaterStorageCapacity"])
                        if math.isnan(data["EffectiveWaterStorageCapacity"]) or data["EffectiveWaterStorageCapacity"] < 0:
                            continue
                        self.db["reservoir"+day].insert_one(data)
                        
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
                for i in range(2,len(tr)):
                    td = tr[i].find_all("td")
                    if(len(td) < 7):
                        continue
                    day = (td[1].string.split(" ")[0]).replace("-","")
                    data = {}
                    reservoirName = td[0].find_all('a')[0].string
                    if not reservoirName in siteHash:
                        continue
                    data["ReservoirIdentifier"] = siteHash[reservoirName]["id"]
                    t = datetime.datetime.strptime(td[1].string+"+0800", "%Y-%m-%d %H:%M:%S%z")
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
                        self.db["reservoir"+day].insert_one(data)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessWaterLevelDrain(self, url):
        print("process water level drain url: "+url)
        try:
            r = requests.get(url)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["value"]
                #add site
                for d in data:
                    if len(d["Thing"]["Locations"]) == 0:
                        continue
                    s = {}
                    s["_id"] = d["Thing"]["name"]
                    s["stationName"] = d["Thing"]["properties"]["stationName"]
                    coord = d["Thing"]["Locations"][0]["location"]["coordinates"]
                    s["lat"] = coord[1]
                    s["lng"] = coord[0]
                    self.db["waterLevelDrainSite"].update({"_id":s["_id"]},s,upsert=True)
                #add data
                for d in data:
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
                        self.db["waterLevelDrain"+day].insert_one(f)

                        loc = d["Thing"]["Locations"][0]["location"]["coordinates"]
                        f["lat"] = loc[1]
                        f["lng"] = loc[0]
                        self.grid.AddGridWaterLevelDrain(f)

                if "@iot.nextLink" in result:
                    self.ProcessWaterLevelDrain(result["@iot.nextLink"])
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessWaterLevelAgri(self, url):
        print("process water level agriculture url: "+url)
        try:
            r = requests.get(url)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["value"]
                #add site
                for d in data:
                    if len(d["Thing"]["Locations"]) == 0:
                        continue
                    s = {}
                    s["_id"] = d["Thing"]["name"]
                    s["stationName"] = d["Thing"]["properties"]["stationName"]
                    coord = d["Thing"]["Locations"][0]["location"]["coordinates"]
                    s["lat"] = coord[1]
                    s["lng"] = coord[0]
                    self.db["waterLevelAgriSite"].update({"_id":s["_id"]},s,upsert=True)
                #add data
                for d in data:
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
                    query = self.db["waterLevelAgri"+day].find_one(key)
                    if query is None:
                        self.db["waterLevelAgri"+day].insert_one(f)

                        coord = d["Thing"]["Locations"][0]["location"]["coordinates"]
                        f["lat"] = coord[1]
                        f["lng"] = coord[0]
                        self.grid.AddGridWaterLevelAgri(f)


                if "@iot.nextLink" in result:
                    self.ProcessWaterLevelAgri(result["@iot.nextLink"])
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessWaterLevelGate(self, url):
        print("process water level gate url: "+url)
        try:
            r = requests.get(url)
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["value"]
                #add site
                for d in data:
                    if len(d["Thing"]["Locations"]) == 0:
                        continue
                    s = {}
                    s["_id"] = d["Thing"]["name"]
                    s["stationName"] = d["Thing"]["properties"]["stationName"]
                    coord = d["Thing"]["Locations"][0]["location"]["coordinates"]
                    s["lat"] = coord[1]
                    s["lng"] = coord[0]
                    self.db["waterLevelGateSite"].update({"_id":s["_id"]},s,upsert=True)
                #add data
                for d in data:
                    if len(d["Observations"]) == 0:
                        continue
                    f = {}
                    f["stationID"] = d["Thing"]["name"]
                    t = datetime.datetime.strptime(d["Observations"][0]["phenomenonTime"],'%Y-%m-%dT%H:%M:%S.%fZ')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)

                    f["time"] = t
                    f[d["name"]] = d["Observations"][0]["result"]
                    key = {"stationID":f["stationID"],"time":f["time"]}
                    day = datetime.datetime.strftime(t,"%Y%m%d")

                    self.db["waterLevelGate"+day].update(key,{"$set":f},upsert=True)

                if "@iot.nextLink" in result:
                    self.ProcessWaterLevelGate(result["@iot.nextLink"])
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessSewerData(self):
        print("process sewer data")
        try:
            r = requests.get("http://117.56.59.17/OpenData/API/Sewer/Get?stationNo=&loginId=sewer01&dataKey=BD3E513A")
            #r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                result = r.json()
                data = result["data"]

                cursor = self.db["sewerStation"].find({})
                siteHash = {}
                for site in cursor:
                    siteHash[site["no"]] = site
                
                for d in data:
                    f = {}
                    f["stationNo"] = d["stationNo"]
                    t = datetime.datetime.strptime(d["recTime"],'%Y%m%d%H%M')
                    t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
                    t = t.replace(tzinfo=taiwan)
                    f["time"] = t
                    f["value"] = d["levelOut"]
                    key = {"stationID":f["stationNo"],"time":f["time"]}
                    day = datetime.datetime.strftime(t,"%Y%m%d")
                    query = self.db["sewer"+day].find_one(key)
                    if query is None:
                        self.db["sewer"+day].insert_one(f)

                        if f["stationNo"] in siteHash:
                            s = siteHash[f["stationNo"]]
                            f["lat"] = s["lat"]
                            f["lng"] = s["lng"]
                            self.grid.AddGridSewer(f)

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

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
from bs4 import BeautifulSoup
import ssl
import pymongo

ssl._create_default_https_context = ssl._create_unverified_context

class AlertData:
    def __init__(self, db):
        self.db = db
        
    def Init(self):
        pass
    
    def CollectData10min(self):
        print("collect alert data 10min")
        #flood warn
        self.CollectAlert("https://alerts.ncdr.nat.gov.tw/JSONAtomFeed.ashx?AlertType=8")
        #debris flow
        self.CollectAlert("https://alerts.ncdr.nat.gov.tw/JSONAtomFeed.ashx?AlertType=9")
        #rain alert
        self.CollectAlert("https://alerts.ncdr.nat.gov.tw/JSONAtomFeed.ashx?AlertType=10")
        #water level warn
        self.CollectAlert("https://alerts.ncdr.nat.gov.tw/JSONAtomFeed.ashx?AlertType=11")
        #reservoir warn
        self.CollectAlert("https://alerts.ncdr.nat.gov.tw/JSONAtomFeed.ashx?AlertType=12")
        #thunderstorm
        self.CollectAlert("https://alerts.ncdr.nat.gov.tw/JSONAtomFeed.ashx?AlertType=1051")
        #water suspend
        self.CollectAlert("https://alerts.ncdr.nat.gov.tw/JSONAtomFeed.ashx?AlertType=1089")
        #typhoon
        self.CollectAlert("https://alerts.ncdr.nat.gov.tw/JSONAtomFeed.ashx?AlertType=5")

    def CollectData1hour(self):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def CollectData1day(self):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def CollectAlert(self,url):
        try:
            print(url)
            r = requests.get(url)
            r.encoding = "utf-8"
            if r.status_code == requests.codes.all_okay:
                data = json.loads(r.text)
                if not isinstance(data["entry"], list):
                    data["entry"] = [data["entry"]]
                    
                for entry in data["entry"]:
                    day = entry["updated"].split("T")[0].replace("-","")
                    query = self.db["alert"+day].find_one({"_id":{"$regex":entry["id"]}})
                    if not query is None:
                        continue
                    link = entry["link"]["@href"]
                    folder = "data/alert/"
                    if not os.path.exists(folder):
                        os.makedirs(folder)
                    file = folder+entry["id"]+".xml"
                    print(link)
                    opener = urllib.request.build_opener()
                    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
                    urllib.request.install_opener(opener)
                    urllib.request.urlretrieve(link, file)
                    self.ProcessAlertFile(file)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessAlertFile(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                soup = BeautifulSoup(f.read(), 'html.parser')
                if soup.status.string != "Actual":  #keep only actual alert
                    return
                id = soup.identifier.string
                day = (soup.sent.string.split("T")[0]).replace("-","")
                infoArr = soup.find_all("info")
                opData = []
                opStatistic = []
                for i,info in enumerate(infoArr):
                    data = {}
                    data["_id"] = id+"_"+str(i)
                    query = self.db["alert"+day].find_one({"_id":data["_id"]})
                    if not query is None:
                        continue
                    data["msgType"] = soup.msgtype.string
                    if not soup.reference is None:
                        data["reference"] = soup.reference.string

                    data["eventcode"] = info.eventcode.value.string
                    data["effective"] = info.effective.string
                    data["expires"] = info.expires.string
                    data["urgency"] = info.urgency.string
                    data["severity"] = info.severity.string
                    data["certainty"] = info.certainty.string
                    data["headline"] = info.headline.string
                    if data["eventcode"] == "typhoon":
                        desc = {}
                        for section in info.description.find_all("section"):
                            if section["title"] == "颱風資訊":
                                desc["typhoon_name"] = section.typhoon_name.string
                                desc["cwb_typhoon_name"] = section.cwb_typhoon_name.string
                            else:
                                desc[section["title"]] = section.string
                        data["description"] = desc
                    else:
                        data["description"] = info.description.string
                    if not info.instruction is None:
                        data["instruction"] = info.instruction.string
                    if not info.responsetype is None:
                        data["responsetype"] = info.responsetype.string

                    for param in info.find_all("parameter"):
                        if param.valuename.string == "severity_level":
                            data["severity_level"] = param.value.string
                        elif param.valuename.string == "debrisID":
                            arr = param.value.string.split(",")
                            data["debrisID"] = arr
                        elif param.valuename.string == "counties":
                            arr = param.value.string.split(",")
                            data["counties"] = arr
                        elif param.valuename.string == "townships":
                            arr = param.value.string.split(" ")
                            data["townships"] = arr
                    data["geocode"] = []
                    for geocode in info.find_all("geocode"):
                        data["geocode"].append(geocode.value.string)
                    data["polygon"] = []
                    for polygon in info.find_all("polygon"):
                        data["polygon"].append(polygon.string)

                    #self.db["alert"+day].insert_one(data)
                    key = {"_id":data["_id"]}
                    opData.append(pymongo.UpdateOne(key, {"$set": data}, upsert=True))

                    #add to daily statistic
                    sta = {}
                    k = data["effective"].rfind(":")
                    tStr = data["effective"][:k]+data["effective"][k+1:]
                    t = datetime.datetime.strptime(tStr, "%Y-%m-%dT%H:%M:%S%z")
                    tday = t.replace(hour=0, minute=0,second=0)
                    inc = {}
                    inc[data["eventcode"]] = 1
                    #self.db["alertStatistic"].update({"time":tday},{"$inc":inc},upsert=True)
                    opStatistic.append(pymongo.UpdateOne({"time":tday}, {"$inc":inc}, upsert=True))
                if len(opData) > 0:
                    self.db["alert"+day].bulk_write(opData,ordered=False)
                if len(opStatistiic) > 0:
                    self.db["alertStatistic"].bulk_write(opStatistic,ordered=False)

        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessHistory(self):
        pass
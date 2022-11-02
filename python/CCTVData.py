
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
import pymongo

ssl._create_default_https_context = ssl._create_unverified_context

class CCTVData:
  def __init__(self, db):
    self.db = db
          
  def Init(self):
    self.AddCCTV("iow_wra","https://sta.ci.taiwan.gov.tw/STA_CCTV/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations&$filter=Thing/properties/authority%20eq%20%27%E6%B0%B4%E5%88%A9%E7%BD%B2%27&$count=true")
    self.AddCCTV("iow_ia","https://sta.ci.taiwan.gov.tw/STA_CCTV/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations&$filter=Thing/properties/authority%20eq%20%27%E6%B0%B4%E5%88%A9%E7%BD%B2%EF%BC%88%E8%88%87%E7%B8%A3%E5%B8%82%E6%94%BF%E5%BA%9C%E5%90%88%E5%BB%BA%EF%BC%89%27&$count=true")
    self.AddCCTV("coa_mudslide","https://sta.ci.taiwan.gov.tw/STA_CCTV/v1.0/Datastreams?$expand=Thing,Thing/Locations,Observations&$filter=Thing/properties/authority%20eq%20%27%E8%A1%8C%E6%94%BF%E9%99%A2%E8%BE%B2%E5%A7%94%E6%9C%83%27&$count=true")

  def AddCCTV(self,type,url):
    #水利署視訊監測影像
    print("process cctv url: "+url)
    try:
      r = requests.get(url,verify=False)
      #r.encoding = "utf-8"
      if r.status_code == requests.codes.all_okay:
        result = r.json()
        data = result["value"]
        ops = []
        for d in data:
          if len(d["Thing"]["Locations"]) == 0:
              continue
          prop = d["Thing"]["properties"]
          #basin = prop["basin"]
          cctv = {}
          cctv["type"] = type
          if type == "iow_wra" or type == "iow_ia":
            cctv["stationID"] = prop["stationID"]
          elif type == "coa_mudslide":
            cctv["stationID"] = prop["StationId"]
          cctv["name"] = prop["stationName"]
          cctv["link"] = d["Observations"][0]["result"]
          loc = d["Thing"]["Locations"][0]["location"]["coordinates"]
          cctv["lat"] = loc[1]
          cctv["lon"] = loc[0]
          
          key = {"stationID":cctv["stationID"]}
          ops.append(pymongo.UpdateOne(key, {"$set": cctv}, upsert=True))
        if len(ops) > 0:
          self.db["cctvStation"].bulk_write(ops,ordered=False)

        if "@iot.nextLink" in result:
          self.AddCCTV(type,result["@iot.nextLink"])
    except:
      print(sys.exc_info()[0])
      traceback.print_exc()
        
    
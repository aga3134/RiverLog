#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""
Created on Wed Oct 18 15:48:59 2017

@author: aga
"""

import sys
import json
from pymongo import MongoClient
import pymongo
import warnings
import traceback
import paho.mqtt.client as mqtt
import datetime
import pytz
import util
#using Asia/Taipei will cause offset to be +0806
#taiwan = pytz.timezone('Asia/Taipei')
taiwan = datetime.timezone(offset = datetime.timedelta(hours = 8))

ip = "gpssensor.ddns.net"  
port = 1883
topic = "LASS/Test/WaterBox_TW/#"

class MQTTReciever:
    def __init__(self, mqttIP, mqttPort, db):
        self.db = db

        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.connect(mqttIP, mqttPort)

    def on_connect(self, client, userdata, flags, rc):
        print("mqtt connected")
        client.subscribe(topic)

    def on_message(self, client, userdata, msg):
        print("recieve topic "+msg.topic)
        try:
            data = msg.payload.decode("utf-8")
            arr = data.split("|")
            data = {}
            for attr in arr:
                v = attr.split("=")
                if len(v) < 2:
                    continue
                data[v[0]] = v[1]

            #update device info
            s = {}
            s["id"] = data["device_id"]
            s["device"] = data["device"]
            s["lat"] = data["gps_lat"]
            s["lng"] = data["gps_lon"]
            s["fake_gps"] = data["FAKE_GPS"]
            key = {"id":s["id"]}
            self.db["waterboxDevice"].create_index("id")
            self.db["waterboxDevice"].update(key,s,upsert=True)

            #update device latest data
            d = {}
            d["device_id"] = data["device_id"]
            t = datetime.datetime.strptime(data["date"]+" "+data["time"],'%Y-%m-%d %H:%M:%S')
            t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)
            d["time"] = t
            d["lat"] = data["gps_lat"]
            d["lng"] = data["gps_lon"]
            if "s_t0" in data:
                d["s_t0"] = util.ToFloat(data["s_t0"])
            if "s_ph" in data:
                d["s_ph"] = util.ToFloat(data["s_ph"])
            if "s_ec" in data:
                d["s_ec"] = util.ToFloat(data["s_ec"])
            if "s_Tb" in data:
                d["s_Tb"] = util.ToFloat(data["s_Tb"])
            if "s_Lv" in data:
                d["s_Lv"] = util.ToFloat(data["s_Lv"])
            if "s_DO" in data:
                d["s_DO"] = util.ToFloat(data["s_DO"])
            if "s_orp" in data:
                d["s_orp"] = data["s_orp"]
            key = {"device_id":s["id"]}
            self.db["waterboxLatest"].create_index("device_id")
            self.db["waterboxLatest"].update(key,d,upsert=True)

            #store data for history review
            t = t.replace(minute=(t.minute-t.minute%10),second=0,microsecond=0)
            dayStr = datetime.datetime.strftime(t,"%Y%m%d")
            d["time"] = t
            del d["lat"]
            del d["lng"]
            key = {"device_id":s["id"],"time":d["time"]}
            self.db["waterbox"+dayStr].create_index("device_id")
            self.db["waterbox"+dayStr].create_index("time")
            self.db["waterbox"+dayStr].update(key,d,upsert=True)

        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def Run(self):
        self.client.loop_forever()

if __name__ == "__main__":
    try:
        conn = MongoClient()
        db = conn["RiverLog"]
        reciever = MQTTReciever(ip,port,db)
        reciever.Run()
    except:
        print(sys.exc_info()[0])
        traceback.print_exc()

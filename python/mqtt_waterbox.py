#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import json
import pymongo
import paho.mqtt.client as mqtt
import datetime
import pytz
import traceback
import util
#using Asia/Taipei will cause offset to be +0806
#taiwan = pytz.timezone('Asia/Taipei')
taiwan = datetime.timezone(offset = datetime.timedelta(hours = 8))

ip = "gpssensor.ddns.net"  
port = 1883

class MQTTReciever:
    def __init__(self):
        conn = pymongo.MongoClient()
        self.db = conn["RiverLog"]
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.connect(ip,port)

    def on_connect(self, client, userdata, flags, rc):
        print("mqtt connected")
        client.subscribe("LASS/Test/WaterBox_TW/#")
        client.subscribe("LASS/Test/WaterQualityBag/#")

    def on_message(self, client, userdata, msg):
        print("recieve topic "+msg.topic)
        if msg.topic.startswith("LASS/Test/WaterBox_TW"):
            self.ProcessLassWaterBox(msg)
        elif msg.topic.startswith("LASS/Test/WaterQualityBag"):
            self.ProcessSYWaterBox(msg)

    def ProcessSYWaterBox(self,msg):
        try:
            message = msg.payload.decode("utf-8")
            print(message)
            #parse message
            fieldArr = message.split("|")
            data = {}
            for field in fieldArr:
                f = field.split("=")
                if len(f) == 2:
                    data[f[0]] = f[1]

            #save to database
            d = {}
            d["source"] = "sy"
            d["device_id"] = data["device_id"]
            d["lat"] = util.ToFloat(data["gps_lat"])
            d["lng"] = util.ToFloat(data["gps_lon"])
            t = datetime.datetime.strptime(data["date"]+" "+data["time"], '%Y-%m-%d %H:%M:%S')
            t = t.replace(minute=(t.minute-t.minute%10),second=0)
            t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)
            d["time"] = t
            if "s_do2" in data:
                d["s_do2"] = util.ToFloat(data["s_do2"])    #溶氧
            if "s_ec2" in data:
                d["s_ec2"] = util.ToFloat(data["s_ec2"])    #導電度
            if "s_ph3" in data:
                d["s_ph3"] = util.ToFloat(data["s_ph3"])    #酸鹼度
            if "s_t8.1" in data:
                d["s_t8.1"] = util.ToFloat(data["s_t8.1"])    #溫度(水體)
            if "s_t8.2" in data:
                d["s_t8.2"] = util.ToFloat(data["s_t8.2"])    #溫度(設備機內)
            if "s_h6" in data:
                d["s_h6"] = util.ToFloat(data["s_h6"])    #濕度(設備機內)
            if "s_v1" in data:
                d["s_v1"] = util.ToFloat(data["s_v1"])    #電壓
            if "s_i1" in data:
                d["s_i1"] = util.ToFloat(data["s_i1"])    #電流
            if "s_rssi1" in data:
                d["s_rssi1"] = util.ToFloat(data["s_rssi1"])    #訊號強度
            #print(d)

            key = {"device_id":d["device_id"],"time":d["time"]}
            day = datetime.datetime.strftime(t,"%Y%m%d")
            self.db["waterbox"+day].replace_one(key,d,upsert=True)

        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
    
    def ProcessLassWaterBox(self,msg):
        try:
            message = msg.payload.decode("utf-8")
            print(message)
            #parse message
            fieldArr = message.split("|")
            data = {}
            for field in fieldArr:
                f = field.split("=")
                if len(f) == 2:
                    data[f[0]] = f[1]

            #save to database
            d = {}
            d["source"] = "lass"
            d["device_id"] = data["device_id"]
            d["lat"] = util.ToFloat(data["gps_lat"])
            d["lng"] = util.ToFloat(data["gps_lon"])
            t = datetime.datetime.strptime(data["date"]+" "+data["time"], '%Y-%m-%d %H:%M:%S')
            t = t.replace(minute=(t.minute-t.minute%10),second=0)
            t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)
            d["time"] = t
            if "s_ph1" in data:
                d["s_ph1"] = util.ToFloat(data["s_ph1"])    #水質-pH
            if "s_ec1" in data:
                d["s_ec1"] = util.ToFloat(data["s_ec1"])    #水質-EC
            if "s_Tb" in data:
                d["s_Tb"] = util.ToFloat(data["s_Tb"])    #水質-濁度
            if "s_t6" in data:
                d["s_t6"] = util.ToFloat(data["s_t6"])    #水溫
            if "s_ph2" in data:
                d["s_ph2"] = util.ToFloat(data["s_ph2"])    #Atlas-pH
            if "s_ec2" in data:
                d["s_ec2"] = util.ToFloat(data["s_ec2"])    #Atlas-EC
            if "s_do2" in data:
                d["s_do2"] = util.ToFloat(data["s_do2"])    #Atlas-DO
            if "s_orp2" in data:
                d["s_orp2"] = util.ToFloat(data["s_orp2"])    #Atlas-ORP
            if "s_t7" in data:
                d["s_t7"] = util.ToFloat(data["s_t7"])    #Atlas-水溫
            if "s_ise1" in data:
                d["s_ise1"] = util.ToFloat(data["s_ise1"])    #ISE電極-氨離子
            if "s_ise2" in data:
                d["s_ise2"] = util.ToFloat(data["s_ise2"])    #ISE電極-硝酸鹽離子
            #print(d)

            key = {"device_id":d["device_id"],"time":d["time"]}
            day = datetime.datetime.strftime(t,"%Y%m%d")
            self.db["waterbox"+day].replace_one(key,d,upsert=True)

        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def Run(self):
        self.client.loop_forever()

if __name__ == "__main__":
    try:
        reciever = MQTTReciever()
        reciever.Run()
    except:
        print(sys.exc_info()[0])
        traceback.print_exc()

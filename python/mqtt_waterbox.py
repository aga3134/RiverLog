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
topic = "LASS/Test/WaterBox_TW/#"

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
        client.subscribe(topic)

    def on_message(self, client, userdata, msg):
        print("recieve topic "+msg.topic)
        try:
            message = msg.payload.decode("utf-8")
            #parse message
            fieldArr = message.split("|")
            data = {}
            for field in fieldArr:
                f = field.split("=")
                if len(f) == 2:
                    data[f[0]] = f[1]

            #save to database
            d = {}
            d["device_id"] = data["device_id"]
            d["lat"] = util.ToFloat(data["gps_lat"])
            d["lng"] = util.ToFloat(data["gps_lon"])
            t = datetime.datetime.strptime(data["date"]+" "+data["time"], '%Y-%m-%d %H:%M:%S')
            t = t.replace(minute=(t.minute-t.minute%10),second=0)
            t = t.replace(tzinfo=pytz.utc).astimezone(taiwan)
            d["time"] = t
            d["s_t0"] = util.ToFloat(data["s_t0"])    #水溫(-20.0~150.0C)
            d["s_ph"] = util.ToFloat(data["s_ph"])    #酸鹼度(0.00~-14.00)
            d["s_ec"] = util.ToFloat(data["s_ec"])    #導電度(0~200000 uS/cm)
            d["s_Tb"] = util.ToFloat(data["s_Tb"])    #濁度(0~10000 NTU)
            d["s_Lv"] = util.ToFloat(data["s_Lv"])    #水位(0.000~20.000 M)
            d["s_DO"] = util.ToFloat(data["s_DO"])    #溶氧(DO 0.00~12.00 mg/L)
            d["s_orp"] = util.ToFloat(data["s_orp"])  #氧化還原電位(ORP -2000~2000 mV)
            print(d)

            key = {"device_id":d["device_id"],"time":d["time"]}
            day = datetime.datetime.strftime(t,"%Y%m%d")
            self.db["waterbox"+day].update(key,d,upsert=True)

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

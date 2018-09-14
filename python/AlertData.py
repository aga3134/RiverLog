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

class AlertData:
    def __init__(self, db):
        self.db = db
        
    def Init(self):
        pass
    
    def CollectData10min(self):
        try:
            print("collect alert data 10min")
            now = datetime.datetime.now()
            now = now.replace(minute=(now.minute-now.minute%10))
            t = now.strftime("%Y-%m-%d_%H-%M")
            
            #landslide alert
            url = "http://data.coa.gov.tw/Service/OpenData/FromM/GetCustomerDebrisAlertInfo.aspx"
            folder = "data/alert/landSlide/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"landSlide_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessLandslide(file)
            
            #rain alert county
            url = "http://fhy.wra.gov.tw/fhy/api/RainMapApi/CountyNameByTownShip"
            folder = "data/alert/rainCounty/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"rainCounty_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessRainCounty(file)
            
            #rain alert draw
            url = "http://fhy.wra.gov.tw/fhy/api/RainMapApi/Draw"
            folder = "data/alert/rainDraw/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"rainDraw_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessRainDraw(file)
            
            #water alert county
            url = "http://fhy.wra.gov.tw/fhy/api/WaterMapApi/CountyNameToStation"
            folder = "data/alert/waterCounty/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"waterCounty_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessWaterCounty(file)
            
            #water alert draw
            url = "http://fhy.wra.gov.tw/fhy/api/WaterMapApi/Draw"
            folder = "data/alert/waterDraw/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"waterDraw_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessWaterDraw(file)
            
            #reservoir alert point
            url = "http://fhy.wra.gov.tw/fhy/api/ReservoirMapApi/Point"
            folder = "data/alert/reservoirPoint/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"reservoirPoint_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessReservoirPoint(file)
            
            #reservoir alert draw
            url = "http://fhy.wra.gov.tw/fhy/api/ReservoirMapApi/Draw"
            folder = "data/alert/reservoirDraw/"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"reservoirDraw_"+t+".json"
            urllib.request.urlretrieve(url, file)
            self.ProcessReservoirDraw(file)
            
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
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
    
    def ProcessLandslide(self,file):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessRainCounty(self,file):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessRainDraw(self,file):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessWaterCounty(self,file):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessWaterDraw(self,file):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessReservoirPoint(self,file):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessReservoirDraw(self,file):
        try:
            pass
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
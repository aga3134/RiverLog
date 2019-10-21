# -*- coding: utf-8 -*-
"""
Created on Fri Aug 31 11:06:27 2018

@author: aga
"""

import requests
import json
import sys
import traceback
import xml.etree.ElementTree as ET
import urllib.request
import datetime
import util
import os
import gc
import math
import csv
import util

class StatisticData:
    def __init__(self, db):
        self.db = db
        config = json.loads(open("../config.json",encoding="utf8").read())
        
    def Init(self):
        pass
    
    def CollectData(self):
        try:
            print("collect statistic data")
            folder = "data/statistic/"
            #灌溉用水
            url = "https://data.wra.gov.tw/Service/OpenData.aspx?format=csv&amp=&id=51649822-A8E1-4F9A-BF17-AFB2D96082DC"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"agriculture.csv"
            urllib.request.urlretrieve(url, file)
            self.ProcessAgriculture(file)

            #養殖用水
            url = "https://data.wra.gov.tw/Service/OpenData.aspx?format=csv&amp=&id=EDB00434-A02D-443C-A237-58B7AA0E3292"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"cultivation.csv"
            urllib.request.urlretrieve(url, file)
            self.ProcessCultivation(file)

            #畜牧用水
            url = "https://scidm.nchc.org.tw/en/dataset/313200000g-000317/resource/1f5b8f34-85fa-4097-9ac4-b7778e717d69/nchcproxy"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"livestock.csv"
            urllib.request.urlretrieve(url, file)
            self.ProcessLivestock(file)

            #生活用水
            url = "https://data.wra.gov.tw/Service/OpenData.aspx?format=csv&amp=&id=9FA78E28-F8DB-4B27-B9F4-9B80EDCA1168"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"living.csv"
            urllib.request.urlretrieve(url, file)
            self.ProcessLiving(file)

            #工業用水
            url = "https://data.wra.gov.tw/Service/OpenData.aspx?format=csv&amp=&id=B5DCF655-13FE-4BEF-B381-DEE4A384DF9C"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"industry.csv"
            urllib.request.urlretrieve(url, file)
            self.ProcessIndustry(file)

            #overview 無直接api網址，需至https://erdb.epa.gov.tw/DataRepository/Statistics/StatSceWaterrecNew.aspx自行下載
            file = folder+"overview.csv"
            self.ProcessOverview(file)

            #每月用水量
            url = "https://data.wra.gov.tw/Service/OpenData.aspx?format=csv&amp=&id=4174948A-323C-4F3A-B8B9-9CCC558AF91E"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"monthWaterUse.csv"
            urllib.request.urlretrieve(url, file)
            self.ProcessMonthWaterUse(file)

            #水庫營運
            url = "http://data.wra.gov.tw/Service/OpenData.aspx?format=csv&amp=&id=416458BC-185A-469F-9ED5-739E1092960F"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"reservoirUse.csv"
            urllib.request.urlretrieve(url, file)
            self.ProcessReservoirUse(file)

            #水庫淤積
            url = "http://data.wra.gov.tw/Service/OpenData.aspx?format=csv&amp=&id=455BF624-9B83-416B-9B12-1C24EAEE2FF7"
            if not os.path.exists(folder):
                os.makedirs(folder)
            file = folder+"reservoirSiltation.csv"
            urllib.request.urlretrieve(url, file)
            self.ProcessReservoirSiltation(file)

        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
    
    def ProcessAgriculture(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                rows = csv.DictReader(f)
                for row in rows:
                    if(row["Status"] != "2"):
                        continue
                    data = {}
                    data["_id"] = row["Year"]+"_"+row["IrrigationAssociation"]
                    data["Area"] = row["Area"]
                    data["FirstPhaseMiscellaneousIrrigationArea"] = util.ToFloat(row["FirstPhaseMiscellaneousIrrigationArea"])
                    data["FirstPhaseMiscellaneousWaterConsumption"] = util.ToFloat(row["FirstPhaseMiscellaneousWaterConsumption"])
                    data["FirstPhaseRiceIrrigationArea"] = util.ToFloat(row["FirstPhaseRiceIrrigationArea"])
                    data["FirstPhaseRiceWaterConsumption"] = util.ToFloat(row["FirstPhaseRiceWaterConsumption"])
                    data["IrrigationAssociation"] = row["IrrigationAssociation"]
                    data["SecondPhaseMiscellaneousIrrigationArea"] = util.ToFloat(row["SecondPhaseMiscellaneousIrrigationArea"])
                    data["SecondPhaseMiscellaneousWaterConsumption"] = util.ToFloat(row["SecondPhaseMiscellaneousWaterConsumption"])
                    data["SecondPhaseRiceIrrigationArea"] = util.ToFloat(row["SecondPhaseRiceIrrigationArea"])
                    data["SecondPhaseRiceWaterConsumption"] = util.ToFloat(row["SecondPhaseRiceWaterConsumption"])
                    data["Status"] = row["Status"]
                    data["Year"] = util.ToInt(row["Year"])
                    query = self.db["waterUseAgriculture"].find_one(data["_id"])
                    if query is None:
                        self.db["waterUseAgriculture"].insert_one(data)

        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessCultivation(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                rows = csv.DictReader(f)
                for row in rows:
                    if(row["Status"] != "2"):
                        continue
                    if(row["CultivationKind"] == "0"):
                        continue
                    data = {}
                    data["_id"] = row["Year"]+"_"+row["County"]+"_"+row["CultivationKind"]
                    data["Area"] = row["Area"]
                    data["County"] = row["County"]
                    data["CultivationArea"] = util.ToFloat(row["CultivationArea"])
                    data["CultivationKind"] = row["CultivationKind"]
                    data["Status"] = row["Status"]
                    data["TotalWaterConsumption"] = util.ToFloat(row["TotalWaterConsumption"])
                    data["Year"] = util.ToInt(row["Year"])
                    query = self.db["waterUseCultivation"].find_one(data["_id"])
                    if query is None:
                        self.db["waterUseCultivation"].insert_one(data)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessLivestock(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                rows = csv.DictReader(f)
                for row in rows:
                    if(row["Status"] != "2"):
                        continue
                    if(row["AnimalHusbandryKind"] == "0"):
                        continue
                    data = {}
                    data["_id"] = row["Year"]+"_"+row["County"]+"_"+row["AnimalHusbandryKind"]
                    data["AnimalHusbandryKind"] = row["AnimalHusbandryKind"]
                    data["Area"] = row["Area"]
                    data["County"] = row["County"]
                    data["LivestockQuantity"] = util.ToFloat(row["LivestockQuantity"])
                    data["Status"] = row["Status"]
                    data["WaterConsumption"] = util.ToFloat(row["WaterConsumption"])
                    data["Year"] = util.ToInt(row["Year"])
                    query = self.db["waterUseLivestock"].find_one(data["_id"])
                    if query is None:
                        self.db["waterUseLivestock"].insert_one(data)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessLiving(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                rows = csv.DictReader(f)
                for row in rows:
                    if(row["Status"] != "2"):
                        continue
                    data = {}
                    data["_id"] = row["Year"]+"_"+row["County"]
                    data["Area"] = row["Area"]
                    data["County"] = row["County"]
                    data["DistributedWaterQuantityPerPersonPerDay"] = util.ToFloat(row["DistributedWaterQuantityPerPersonPerDay"])
                    data["DomesticWaterConsumptionPerPersonPerDay"] = util.ToFloat(row["DomesticWaterConsumptionPerPersonPerDay"])
                    data["SelfIntakePopulation"] = util.ToFloat(row["SelfIntakePapulation"])
                    data["SelfIntakeWaterConsumption"] = util.ToFloat(row["SelfIntakeWaterConsumption"])
                    data["SelfIntakeWaterConsumptionPerPersonPerDay"] = util.ToFloat(row["SelfIntakeWaterConsumptionPerPersonPerDay"])
                    data["Status"] = row["Status"]
                    data["TapWaterConsumption"] = util.ToFloat(row["TapWaterConsumption"])
                    data["TapWaterPopulation"] = util.ToFloat(row["TapWaterPopulation"])
                    data["TotalPopulation"] = util.ToFloat(row["TotalPopulation"])
                    data["WaterSalesPerPersonPerDay"] = util.ToFloat(row["WaterSalesPerPersonPerDay"])
                    data["Year"] = util.ToInt(row["Year"])
                    query = self.db["waterUseLiving"].find_one(data["_id"])
                    if query is None:
                        self.db["waterUseLiving"].insert_one(data)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessIndustry(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                rows = csv.DictReader(f)
                for row in rows:
                    if(row["Status"] != "2"):
                        continue
                    if(row["IndustrialWaterConsumption"] == 0):
                        continue
                    data = {}
                    data["_id"] = row["Year"]+"_"+row["County"]+"_"+row["Category"]
                    data["Area"] = row["Area"]
                    data["Category"] = row["Category"]
                    data["County"] = row["County"]
                    data["IndustrialWaterConsumption"] = util.ToFloat(row["IndustrialWaterConsumption"])
                    data["IndustryArea"] = util.ToFloat(row["IndustryArea"])
                    data["Status"] = row["Status"]
                    data["Year"] = util.ToInt(row["Year"])
                    query = self.db["waterUseIndustry"].find_one(data["_id"])
                    if query is None:
                        self.db["waterUseIndustry"].insert_one(data)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessOverview(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                with open(file,"r",encoding="utf8") as f:
                    rows = csv.reader(f)
                    for row in rows:
                        serial = util.ToFloat(row[0])
                        if(math.isnan(serial)):
                            continue
                        if(row[2] == "0"):
                            continue
                        data = {}
                        data["_id"] = row[1][0:-1]
                        data["Year"] = util.ToInt(data["_id"])
                        data["TotalWaterSupply"] = util.ToFloat(row[2].replace(",",""))
                        data["WaterSupplyRiver"] = util.ToFloat(row[4].replace(",",""))
                        data["WaterSupplyReservoir"] = util.ToFloat(row[5].replace(",",""))
                        data["WaterSupplyUnderGround"] = util.ToFloat(row[6].replace(",",""))
                        data["TotalWaterUse"] = util.ToFloat(row[7].replace(",",""))
                        data["WaterUseAgriculture"] = util.ToFloat(row[9].replace(",",""))
                        data["WaterUseLivestock"] = util.ToFloat(row[10].replace(",",""))
                        data["WaterUseCultivation"] = util.ToFloat(row[11].replace(",",""))
                        data["WaterUseLiving"] = util.ToFloat(row[12].replace(",",""))
                        data["WaterUseIndustry"] = util.ToFloat(row[13].replace(",",""))
                        query = self.db["waterUseOverview"].find_one(data["_id"])
                        if query is None:
                            self.db["waterUseOverview"].insert_one(data)

        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessMonthWaterUse(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                rows = csv.DictReader(f)
                for row in rows:
                    data = {}
                    data["_id"] = row["Year"]+"_"+row["Month"]+"_"+row["County"]+"_"+row["Town"]
                    data["County"] = row["County"]
                    data["Month"] = util.ToInt(row["Month"])
                    data["TheDailyDomesticConsumptionOfWaterPerPerson"] = util.ToFloat(row["TheDailyDomesticConsumptionOfWaterPerPerson"])
                    data["Town"] = row["Town"]
                    data["Year"] = util.ToInt(row["Year"])
                    query = self.db["monthWaterUse"].find_one(data["_id"])
                    if query is None:
                        self.db["monthWaterUse"].insert_one(data)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
            
    def ProcessReservoirUse(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                rows = csv.DictReader(f)
                for row in rows:
                    data = {}
                    data["_id"] = row["Year"]+"_"+row["ReservoirName"]
                    data["Area"] = row["Area"]
                    data["BackWaterVolumeOfPowerGeneration"] = util.ToFloat(row["BackWaterVolumeOfPowerGeneration"])
                    data["DischargeWaterVolumeOfPowerGeneration"] = util.ToFloat(row["DischargeWaterVolumeOfPowerGeneration"])
                    data["EndYearStoragedWater"] = util.ToFloat(row["EndYearStoragedWater"])
                    data["EndYearWaterLevel"] = util.ToFloat(row["EndYearWaterLevel"])
                    data["FlushingVolume"] = util.ToFloat(row["FlushingVolume"])
                    data["GrossVolumeOfWaterConsumptionForAgricultureWater"] = util.ToFloat(row["GrossVolumeOfWaterConsumptionForAgricultureWater"])
                    data["GrossVolumeOfWaterConsumptionForAllPurposes"] = util.ToFloat(row["GrossVolumeOfWaterConsumptionForAllPurposes"])
                    data["GrossVolumeOfWaterConsumptionForDomesticWater"] = util.ToFloat(row["GrossVolumeOfWaterConsumptionForDomesticWater"])
                    data["GrossVolumeOfWaterConsumptionForIndustrialWater"] = util.ToFloat(row["GrossVolumeOfWaterConsumptionForIndustrialWater"])
                    data["InflowVolume"] = util.ToFloat(row["InflowVolume"])
                    data["InitialStorageWater"] = util.ToFloat(row["InitialStorageWater"])
                    data["LeakageVolume"] = util.ToFloat(row["LeakageVolume"])
                    data["OthersDischargeVolume"] = util.ToFloat(row["OthersDischargeVolume"])
                    data["ReservoirName"] = row["ReservoirName"]
                    data["SedimentationVariation"] = util.ToFloat(row["SedimentationVariation"])
                    data["Year"] = util.ToInt(row["Year"])
                    query = self.db["reservoirUse"].find_one(data["_id"])
                    if query is None:
                        self.db["reservoirUse"].insert_one(data)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()

    def ProcessReservoirSiltation(self,file):
        print("process file %s" % file)
        try:
            with open(file,"r",encoding="utf8") as f:
                rows = csv.DictReader(f)
                for row in rows:
                    data = {}
                    data["_id"] = row["Year"]+"_"+row["ReservoirName"]
                    data["Area"] = row["Area"]
                    data["CurruntCapacity"] = util.ToFloat(row["CurruntCapacity"])
                    data["CurruntEffectiveCapacity"] = util.ToFloat(row["CurruntEffectiveCapacity"])
                    data["DesignedCapacity"] = util.ToFloat(row["DesignedCapacity"])
                    data["DesignedEffectiveCapacity"] = util.ToFloat(row["DesignedEffectiveCapacity"])
                    data["ReservoirName"] = row["ReservoirName"]
                    data["ReservoirSedimentationVolume"] = util.ToFloat(row["ReservoirSedimentationVolume"])
                    data["TheLastestMeasuredTimeOfReservoirCapacity"] = util.ToFloat(row["TheLastestMeasuredTimeOfReservoirCapacity"])
                    data["Year"] = util.ToInt(row["Year"])
                    query = self.db["reservoirSiltation"].find_one(data["_id"])
                    if query is None:
                        self.db["reservoirSiltation"].insert_one(data)
        except:
            print(sys.exc_info()[0])
            traceback.print_exc()
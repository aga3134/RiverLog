# -*- coding: utf-8 -*-
"""
Created on Fri Aug 31 10:59:15 2018

@author: aga
"""
import sys
from AlertData import AlertData
from WeatherData import WeatherData
from WaterData import WaterData
from StatisticData import StatisticData
from ElevationData import ElevationData
from pymongo import MongoClient
import json
import requests

if __name__ == "__main__":
    conn = MongoClient()
    db = conn["RiverLog"]
    alert = AlertData(db)
    water = WaterData(db)
    weather = WeatherData(db)
    statistic = StatisticData(db)
    elevation = ElevationData(db)
        
    #weather.ProcessRain("data/rain.xml")
    #water.Init()
    #water.ProcessWaterLevel("data/waterLevel.json")
    #water.ProcessReservoir("data/reservoir_2018-09-01_12.json")
    
    args = sys.argv
    if "init" in args:
        weather.Init()
        water.Init()
        alert.Init()
        
    if "collect10min" in args:
        weather.CollectData10min()
        water.CollectData10min()
        alert.CollectData10min()
        
    if "collect1hour" in args:
        weather.CollectData1hour()
        water.CollectData1hour()
        alert.CollectData1hour()
        
    if "collect1day" in args:
        weather.CollectData1day()
        water.CollectData1day()
        alert.CollectData1day()
        
    if "processHistory" in args:
        weather.ProcessHistory()
        water.ProcessHistory()
        alert.ProcessHistory()

    if "statistic" in args:
        statistic.CollectData()

    if args[1] == "genGrid":
        startDate = args[2]
        endDate = args[3]
        weather.GenGridFromDB(startDate,endDate)

    if args[1] == "elevation":
        folder = args[2]
        elevation.CollectDataFromFolder(folder)
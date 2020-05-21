import json
import os
import requests
import math

folder = "../static/geo/river/"

for filename in os.listdir(folder):
    if filename.endswith(".json"):
        file = os.path.join(folder, filename) 
        print(file)
        ptHash = {}
        ptArr = []
        arcArr = []
        with open(file,"r",encoding="utf-8") as f:
            data = json.load(f)
            #get points & arcs
            for arc in data["arcs"]:
                newArc = []
                arcIndex = len(arcArr)
                for pt in arc:
                    key = str(pt[0])+"_"+str(pt[1])
                    if key in ptHash:
                        if arcIndex in ptHash[key]["arc"]:  #duplicate pt
                            continue
                        ptHash[key]["arc"].append(arcIndex)
                        ptIndex = ptHash[key]["index"]
                        newArc.append(ptIndex)
                    else:
                        newPt = {}
                        newPt["coord"] = pt
                        newPt["arc"] = [arcIndex]
                        ptIndex = len(ptArr)
                        newPt["index"] = ptIndex
                        newArc.append(ptIndex)
                        ptHash[key] = newPt
                        ptArr.append(pt)
                arcArr.append({"pt":newArc})

            #get height map within bbox
            minLat = data["bbox"][1]-0.001
            maxLat = data["bbox"][3]+0.001
            minLng = data["bbox"][0]-0.001
            maxLng = data["bbox"][2]+0.001
            url = "http://localhost/elev/gridData?level=0"
            url += "&minLat="+str(minLat)
            url += "&maxLat="+str(maxLat)
            url += "&minLng="+str(minLng)
            url += "&maxLng="+str(maxLng)
            print(url)

            r = requests.get(url)
            if r.status_code == requests.codes.all_okay:
                elev = json.loads(r.text)["data"]["data"]
                elevHash = {}
                for e in elev:
                    key = str(e["x"])+"_"+str(e["y"])
                    elevHash[key] = e["elevSum"]
                #print(elevHash)

            #get height value for each point
            for ptKey in ptHash:
                pt = ptHash[ptKey]
                x = round(pt["coord"][0]*1000)
                y = round(pt["coord"][1]*1000)
                key = str(x)+"_"+str(y)
                pt["height"] = elevHash[key]       

            #compute up/down stream point for single arc
            for arc in arcArr:
                index1 = arc["pt"][0]
                coord1 = ptArr[index1]
                key1 = str(coord1[0])+"_"+str(coord1[1])
                pt1 = ptHash[key1]

                index2 = arc["pt"][len(arc["pt"])-1]
                coord2 = ptArr[index2]
                key2 = str(coord2[0])+"_"+str(coord2[1])
                pt2 = ptHash[key2]

                if pt1["height"] >= pt2["height"]:
                    arc["upPt"] = index1
                    arc["downPt"] = index2
                else:
                    arc["upPt"] = index2
                    arc["downPt"] = index1

            #compute up/down stream across arcs
            for key in ptHash:
                pt = ptHash[key]
                if len(pt["arc"]) > 1:
                    upStream = []
                    downStream = []
                    print(pt)
                    for arcIndex in pt["arc"]:
                        arc = arcArr[arcIndex]
                        print("arcIndex:"+str(arcIndex)+" up:"+str(arc["upPt"])+" down:"+str(arc["downPt"]))
                        if pt["index"] == arc["upPt"]:
                            downStream.append(arcIndex)
                        elif pt["index"] == arc["downPt"]:
                            upStream.append(arcIndex)
                    for arcIndex in upStream:
                        arcArr[arcIndex]["downStream"] = downStream
                        print(arcArr[arcIndex])

                

            #compute path level

            #for key in ptHash:
            #    print(ptHash[key])
            #    if len(ptHash[key]["arc"]) > 1:
            #        for a in ptHash[key]["arc"]:
            #            print(arcArr[a])
            #print(ptArr)
            #print(arcArr)
            #print(ptHash)
        break
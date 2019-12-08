#from subprocess import check_output

layer = iface.mapCanvas().currentLayer()
allFeatures = layer.getFeatures()
basinNo = []
for feature in allFeatures:
    no = feature["BASIN_NO"]
    if no not in basinNo:
        basinNo.append(no)

folder = "C:/Users/aga/Desktop/river/"
for no in basinNo:
    print(no)
    expr = QgsExpression( "\"BASIN_NO\"='"+no+"'" )
    it = layer.getFeatures( QgsFeatureRequest( expr ) )
    ids = [i.id() for i in it]
    layer.selectByIds( ids )
    geoJsonName = folder+"river_"+no+".geojson"
    topoJsonName = folder+"river_"+no+".json"
    QgsVectorFileWriter.writeAsVectorFormat(layer, geoJsonName, "utf-8", layer.crs(), "GeoJSON", onlySelected=True)
    #check_output("C:/Users/aga/AppData/Roaming/npm/geo2json "+geoJsonName+" -o "+topoJsonName, shell=True)

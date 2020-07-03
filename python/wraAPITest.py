import json
import requests

if __name__ == "__main__":
	config = json.loads(open("../config.json",encoding="utf8").read())
	root = config["wraAPIKey"]["root"]
	clientID = config["wraAPIKey"]["clientID"]
	clientSecret = config["wraAPIKey"]["clientSecret"]

	#get token
	payload = {
		"grant_type":"client_credentials",
		"client_id":clientID,
		"client_secret": clientSecret
	}
	response = requests.post(root+"/v3/oauth2/token", data=payload).json()
	token = response['access_token']

	#get data
	headers = {"Accept": "application/json", "Authorization":"Bearer %s" % token}
	#response = requests.get(root+"/v3/api/StationGroup/Get/All/{Station}", headers = headers).json()
	#response = requests.get(root+"/v3/api/Station/Get/All/{PhysicalQuantity|Category}", headers = headers).json()
	#with open("data.json", "w", encoding="utf8") as outfile:
	#	json.dump(response, outfile, indent=4, ensure_ascii=False)

	response = requests.get(root+"/v3/api/RasterMap/File/List", headers = headers).json()
	print(response)
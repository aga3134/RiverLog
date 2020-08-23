import json
import requests

root = "https://iot.wra.gov.tw"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImFnYTMxMzQiLCJyb2xlIjoiVXNlciIsIm5iZiI6MTU5NzY0ODEwNCwiZXhwIjoxNTk3NjQ5OTA0LCJpYXQiOjE1OTc2NDgxMDQsImlzcyI6Ikh5ZHJvbG9neS5PQXV0aDIiLCJhdWQiOiJIeWRyb2xvZ3kuT3BlbkRhdGFBcGkifQ.ys4oW4mEdW9ftnuomx01PpFj_0BfcYxOTgECrGcOoTw"

if __name__ == "__main__":
	headers = {"Authorization": "Bearer "+token}

	print("\n縣市代碼")
	response = requests.get(root+"/adminDivisions/county", headers = headers).json()
	print(response)

	print("\n鄉鎮代碼")
	response = requests.get(root+"/adminDivisions/town", headers = headers).json()
	print(response)

	print("\n集水區降雨資料")
	response = requests.get(root+"/precipitation/basins", headers = headers).json()
	print(response)

	print("\n水系代碼")
	response = requests.get(root+"/river/basins", headers = headers).json()
	print(response)

	print("\n河川、區排水位站")
	response = requests.get(root+"/river/stations", headers = headers).json()
	print(response)

	print("\n路面淹水感知器")
	response = requests.get(root+"/uswg/stations", headers = headers).json()
	print(response)
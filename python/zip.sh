ym=$(date '+%Y-%m')
if [ ! -z "$1" ]
  then
    ym=$1
fi
echo "$1"
echo "zip data for $ym"

zip alert_$ym.zip data/alert/*_$ym*.xml
rm data/alert/*_$ym*.xml

zip rain_$ym.zip data/rain/*_$ym*.xml
rm data/rain/*_$ym*.xml

zip reservoir_$ym.zip data/reservoir/*_$ym*.json
rm data/reservoir/*_$ym*.json

zip waterLevel_$ym.zip data/waterLevel/*_$ym*.json
rm data/waterLevel/*_$ym*.json

zip typhoon_$ym.zip data/typhoon/*_$ym*.xml
rm data/typhoon/*_$ym*.xml

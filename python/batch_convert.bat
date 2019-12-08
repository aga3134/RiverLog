@ECHO OFF
setlocal EnableExtensions EnableDelayedExpansion

for /r %%A in (*.geojson) do (
  set "input=%%A"
  set "output=!input:geojson=json!"
  echo "geo2topo !input! -o !output!"
  START /B geo2topo !input! -o !output!
)

var fs = require('graceful-fs');

const NAME = "data"
const ZOOM = 14;

function latlonToTilenumber(lat, lon)
{
	var n = Math.pow(2, ZOOM);
	lat_rad = lat * Math.PI / 180;
	return {
		"x": Math.floor(n * ((lon + 180) / 360)), 
		"y": Math.floor(n * (1 - (Math.log(Math.tan(lat_rad) + 1/Math.cos(lat_rad)) / Math.PI)) / 2) }
}

var data = JSON.parse(fs.readFileSync(NAME + ".json", "utf8"));
var tiledData = {};

for (var i = 0; i < data.features.length; i++)
{
	var feature = data.features[i];
	var co = feature.geometry.coordinates;
	var tileNum = latlonToTilenumber(co[1], co[0]);
	if (!tiledData[tileNum.x])
		tiledData[tileNum.x] = {};
	if (!tiledData[tileNum.x][tileNum.y])
		tiledData[tileNum.x][tileNum.y] = [];
	tiledData[tileNum.x][tileNum.y].push(feature);
}

// TODO import function from geoHelpers, so tile equality is guaranteed
var numTiles = 0;
for (var x in tiledData)
{
	for (var y in tiledData[x])
	{
		numTiles++;
		var objectToWrite = {
			"type": "FeatureCollection",
			"features": tiledData[x][y]
		}
		var fileName = NAME + "/" + x + "_" + y + ".json";
		fs.writeFile(fileName, JSON.stringify(objectToWrite, null, 4), function(err) {
			if(err) {
				return console.log(err);
			}
		}); 	
	}
}

console.log("Data density: " + (data.features.length / numTiles).toFixed(2) + " POI per tile");




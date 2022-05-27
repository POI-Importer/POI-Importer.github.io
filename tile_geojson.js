var fs = require('graceful-fs');
var mkdir = require('mkdirp');
var rmdir = require('rimraf');
var commandLineArgs = require("command-line-args");
 
var options = commandLineArgs([
    { name: "dataset", alias: "d", type: String },
    { name: "reponame", alias: "r", type: String },
]);

var repo = options.reponame;
var data = options.dataset;

if (!repo)
{
	console.log("ERROR: No --reponame provided.");
	process.exit(1);
}

if (!data)
{
	console.log("ERROR: No --dataset provided.");
	process.exit(1);
}

if (repo.charAt(repo.length - 1) != "/")
	repo += "/";

var zoom = JSON.parse(fs.readFileSync(repo + "dataset.json", "utf8")).zoom;

// TODO import function from geoHelpers, so tile equality is guaranteed
function latlonToTilenumber(lat, lon)
{
	var n = Math.pow(2, zoom);
	lat_rad = lat * Math.PI / 180;
	return {
		"x": Math.floor(n * ((lon + 180) / 360)), 
		"y": Math.floor(n * (1 - (Math.log(Math.tan(lat_rad) + 1/Math.cos(lat_rad)) / Math.PI)) / 2) }
}

var data = JSON.parse(fs.readFileSync(data, "utf8"));
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

// Make sure the dir is empty and exists afterwards
rmdir.sync(repo + "data");
mkdir.sync(repo + "data");

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
		var fileName = repo + "data/" + x + "_" + y + ".json";
		fs.writeFile(fileName, JSON.stringify(objectToWrite, null, 4), function(err) {
			if(err) {
				return console.log(err);
			}
		}); 	
	}
}

console.log("Data density: " + (data.features.length / numTiles).toFixed(2) + " POI per tile");




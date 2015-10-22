// vim: tabstop=4:softtabstop=4:shiftwidth=4:noexpandtab

// GLOBAL VARIABLES
var overpassapi = "http://overpass-api.de/api/interpreter?data=";
var datasets = {
	"Belgium":
	{
		"BE_dl":
		{
			"url": "http://raw.githubusercontent.com/POI-Importer/belgium-haltes-de-lijn/master/dataset.json",
			"name": "Haltes De Lijn",
		},
	},
	"Italy": {
		"IT_fuel":
		{
			"url": "http://raw.githubusercontent.com/POI-Importer/italia-stazioni-di-servizo/master/dataset.json",
			"name": "Stazioni di servizo",
		}
	},
};
var datasetSettings = {};
var tiledData = {};
var appSettings = {};
var queryStatus = {"busy": false, "waiting": false};

function loadDatasets()
{
	for (var country in datasets)
	{
		for (var dataset in datasets[country])
		{
			(function (country, dataset)
			{
				htmlHelper.addDataset(country, dataset);
				var req = new XMLHttpRequest();
				req.overrideMimeType("application/json");
				req.onreadystatechange = function()
				{
					if (req.readyState != 4)
						return;
					var settings = JSON.parse(req.responseText);
					settings.layer = new L.LayerGroup();
					datasetSettings[dataset] = settings;
					var el = document.getElementById(dataset + "Dataset");
					if (el.checked)
						toggleDataset(dataset, el);
				}
				req.open("GET", datasets[country][dataset].url, true);
				try
				{
					req.send(null);
				}
				catch (e)
				{
					console.log(datasets[country][dataset].url);
					console.log(e);
				}
			})(country, dataset);
		}
	}
}

function toggleDataset(dataset, element)
{
	if (!datasetSettings[dataset] || !datasetSettings[dataset].layer)
		return; // wait until the page is loaded

	if (element.checked)
		mapObj.addLayer(datasetSettings[dataset].layer);
	else
		mapObj.removeLayer(datasetSettings[dataset].layer);
	loadData();
}

function changeSetting(element)
{
	var id = element.id;
	if (id.slice(-7) != "Setting")
		return;
	id = id.slice(0, -7);
	appSettings[id] = element.checked;
	if (id == "hideCompletePOI") // re-render points
		for (var dataset in tiledData)
			for (var tileName in tiledData[dataset])
				if (tiledData[dataset][tileName].data)
					for (var p = 0; p < tiledData[dataset][tileName].data.length; p++)
						displayPoint(dataset, tileName, p)
	saveAppState();
}

function loadData()
{
	var mapBounds = mapObj.getBounds();
	var mapCenter = mapObj.getCenter();
	var mapZoom = mapObj.getZoom();
	// get center in tile coordinates
	for (var datasetName in datasetSettings)
	{
		if (!tiledData[datasetName])
			tiledData[datasetName] = {};
		var settings = datasetSettings[datasetName];

		if (!mapObj.hasLayer(settings.layer))
			continue;

		if (!settings.icons)
			loadIcons(settings);

		var tileCoordinates = geoHelper.latlonToTilenumber(
			mapCenter.lat,
			mapCenter.lng,
			settings.data.zoom);

		// Load 9 tiles around the center
		for (var x = tileCoordinates.x - 1; x <= tileCoordinates.x + 1; x++)
		{
			for (var y = tileCoordinates.y - 1; y <= tileCoordinates.y + 1; y++)
			{
				var tileName = x + "_" + y;
				if (tiledData[datasetName][tileName])
					continue; // tile already loaded or loading
				tiledData[datasetName][tileName] = {};

				(function(datasetName, tileName, source)
				{
					var req = new XMLHttpRequest();
					req.overrideMimeType("application/json");
					req.onreadystatechange = function()
					{
						if (req.readyState != 4)
							return;
						var data = geojsonToPointlist(JSON.parse(req.responseText));
						tiledData[datasetName][tileName].data = data;
						for (var p = 0; p < data.length; p++)
							displayPoint(datasetName, tileName, p);
						loadOverpass();
					}
					req.open("GET", source + "/" + tileName + ".json", true);
					try { req.send(null); } catch (e) {}
				})(datasetName, tileName, settings.data.source);
			}
		}
		loadOverpass();
	}
	saveAppState();
}

function loadOverpass()
{
	// Overpass only accepts one query at a time, schedule new query if query is waiting
	if (queryStatus.busy)
	{
		queryStatus.waiting = true;
		return;
	}
	queryStatus.waiting = false;
	var mapZoom = mapObj.getZoom();
	var mapBounds = mapObj.getBounds();
	var mapCenter = mapObj.getCenter();
	// Make query
	var query = "[out:json];\n";
	var types = ["node"/*,"way","rel"*/];
	var queriedDatasets = [];
	for (var datasetName in datasetSettings)
	{
		if (!tiledData[datasetName])
			continue;
		var settings = datasetSettings[datasetName];
		var tileCoordinates = geoHelper.latlonToTilenumber(
			mapCenter.lat,
			mapCenter.lng,
			settings.data.zoom);

		for (var x = tileCoordinates.x - 1; x <= tileCoordinates.x + 1; x++)
		{
			for (var y = tileCoordinates.y - 1; y <= tileCoordinates.y + 1; y++)
			{
				var tileName = x + "_" + y;
				var tileBbox = geoHelper.tilenumberToBbox(x, y, settings.data.zoom);
				// add a margin to the bbox
				geoHelper.padBbox(tileBbox, settings.dist);

				if (!tiledData[datasetName][tileName] ||
					!tiledData[datasetName][tileName].data ||
					!tiledData[datasetName][tileName].data.length)
						continue;
				if (tiledData[datasetName][tileName].overpassQueried)
					continue;
				tiledData[datasetName][tileName].overpassQueried = true;

				query += "(";
				for (var t = 0; t < types.length; t++)
					query += types[t] + settings.query + "(" + tileBbox.b + "," + tileBbox.l + "," + tileBbox.t + "," + tileBbox.r + ");";
				query += "); out center; out count;\n";

				queriedDatasets.push({"tileName": tileName, "datasetName": datasetName});
			}
		}
	}

	if (!queriedDatasets.length)
		return;

	console.log("overpass query:\n" + query);

	// Send query to overpass
	var req = new XMLHttpRequest();
	req.onreadystatechange = function()
	{
		if (req.readyState != 4)
			return;
		if (req.status != 200)
			return;
		var osmData = JSON.parse(req.responseText).elements;
		compareData(queriedDatasets, osmData);
		queryStatus.busy = false;
		if (queryStatus.waiting)
			loadOverpass();
	}
	queryStatus.busy = true;
	req.open("GET", overpassapi + encodeURIComponent(query), true);
	req.send(null);	
}

function displayPoint(datasetName, tileName, idx)
{
	var point = tiledData[datasetName][tileName].data[idx];
	var settings = datasetSettings[datasetName];
	// add marker to the data for future reference
	if (!point.marker)
		point.marker = L.marker(point.coordinates, {icon: settings.greyIcon})
			.addTo(settings.layer);

	if (point.score == undefined)
		return; // only initial display

	// if the point has been compared, change its colour
	if (point.score == point.maxScore && appSettings.hideCompletePOI)
		point.marker.setOpacity(0);
	else
		point.marker.setOpacity(1);

	point.marker.setIcon(settings.icons[Math.floor(10 * point.score/point.maxScore)]);
	point.marker.bindPopup(htmlHelper.getPopup(datasetName, tileName, idx), {"maxWidth": 900});
}

function loadIcons(settings)
{
	// create the icon in 11 colours from red to green + a grey one
	settings.icons = [];
	for (var i = 0; i <= 10; i++)
	{
		var colour = hslToRgb(i / 30, 1, 0.5);
		settings.icons.push(L.MakiMarkers.icon({icon: settings.icon, color: colour, size: "m"}));
	}
	settings.greyIcon = L.MakiMarkers.icon({icon: settings.icon, color: "#808080", size: "m"});
}

function geojsonToPointlist(geojson)
{
	var results = [];
	if (!geojson.features)
		return results;

	for (var i = 0; i < geojson.features.length; i++)
	{
		// TODO skip non-point features
		var point = {};
		// switch lat and lon to the OSM standard order
		point.coordinates = {};
		point.coordinates.lat = geojson.features[i].geometry.coordinates[1];
		point.coordinates.lon = geojson.features[i].geometry.coordinates[0];
		point.properties = geojson.features[i].properties;
		results.push(point);
	}
	return results;
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
	var r, g, b;

	if(s == 0)
	{
		r = g = b = l; // achromatic
	}
	else
	{
		function hue2rgb(p, q, t) {
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	function toHex(n) {
		var h = Math.round(n * 255).toString(16);
		if (h.length < 2)
			h = "0" + h;
		return h;
	}

	return "#" + toHex(r) + toHex(g) + toHex(b);
}


function escapeXML(str)
{
	return str.replace(/&/g, "&amp;")
		.replace(/'/g, "&apos;")
		.replace(/>/g, "&gt;")
		.replace(/</g, "&lt;");
}

function saveAppState()
{
	var date = new Date();
	date.setFullYear(date.getFullYear() + 1);
	var stateString = getStateString();
	document.cookie = "state=" + encodeURIComponent(stateString) + ";expires=" + date.toUTCString();
	window.location.hash = stateString;
}

function loadAppState()
{
	var stateString;
	if (window.location.hash)
		stateString = window.location.hash.slice(1);
	else if (document.cookie)
		stateString = decodeURIComponent(document.cookie.slice(6));
	if (stateString)
		applyStateString(stateString);
}

function getStateString()
{
	var r = "";
	var center = mapObj.getCenter();
	r += "map=" + mapObj.getZoom() + "/" + center.lat.toFixed(4) + "/" + center.lng.toFixed(4);

	var loadedDatasets = [];
	for (var dataset in datasetSettings)
		if (mapObj.hasLayer(datasetSettings[dataset].layer))
			loadedDatasets.push(encodeURIComponent(dataset));
	if (loadedDatasets.length > 0)
		r+= "&datasets=" + loadedDatasets.join(";");

	var activatedSettings = [];
	for (var key in appSettings)
		if (appSettings[key] == true)
			activatedSettings.push(encodeURIComponent(key));
	if (activatedSettings.length > 0)
		r += "&settings=" + activatedSettings.join(";");
	return r;
}

function applyStateString(state)
{
	var splitState = state.split("&");
	for (var i = 0; i < splitState.length; i++)
	{
		if (splitState[i].indexOf("map=") == 0)
		{
			var mapState = splitState[i].match(/[0-9\.]+/g);
			mapObj.setView([+mapState[1], +mapState[2]], +mapState[0]);
		}
		else if (splitState[i].indexOf("datasets=") == 0)
		{
			var loadedDatasets = splitState[i].substr(9).split(";"); 
			for (var d = 0; d < loadedDatasets.length; d++)
			{
				var id = decodeURIComponent(loadedDatasets[d])
				var el = document.getElementById(id + "Dataset");
				el.checked = true;
				toggleDataset(id, el);
			}
		}
		else if (splitState[i].indexOf("settings=") == 0)
		{
			var activatedSettings = splitState[i].substr(9).split(";");
			for (var s = 0; s < activatedSettings.length; s++)
			{
				var id = decodeURIComponent(activatedSettings[s]);
				var el = document.getElementById(id + "Setting");
				el.checked = true;
				changeSetting(el);
			}
		}
	}
}

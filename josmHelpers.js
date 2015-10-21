var josmHelper = (function()
{
	var josmUrl = "http://localhost:8111/";
	var openOsmArea = function(area)
	{
		var url = josmUrl + "load_and_zoom" + area;
		var req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.send(null);
	};

	var importPoint = function(datasetName, tileName, idx)
	{
		var settings = datasetSettings[datasetName];
		var point = tiledData[datasetName][tileName].data[idx];
		var timeStr = (new Date()).toISOString();
		var url =  josmUrl + "load_data?data=";
		var xml = "<osm version='0.6' generator='POI_importer'>";
		xml += "<node id='-1' "+
			"lat='" + point.coordinates.lat + "' " +
			"lon='" + point.coordinates.lon + "' " +
			"version='0' "+
			"timestamp='" + timeStr + "' " +
			"uid='1' user=''>";

		for (var t = 0; t < settings.tagmatch.length; t++)
		{
			var tag = settings.tagmatch[t];
			xml += "<tag k='" + escapeXML(tag.osmkey) + "' v='" + escapeXML(point.properties[tag.datakey]) + "'/>"
		}
		xml += "</node>"
		xml += "</osm>"

		var req = new XMLHttpRequest();
		req.onreadystatechange = function()
		{
			if (req.readyState == 4 && req.status == 400)
				// something went wrong. Alert the user with appropriate messages
				testJosmVersion();
		}
		req.open("GET", url + encodeURIComponent(xml), true);
		req.send(null);
	};

	var testJosmVersion = function() {
		var req = new XMLHttpRequest();
		req.open("GET", josmUrl + "version", true);
		req.send(null);
		req.onreadystatechange = function()
		{
			if (req.readyState != 4)
				return;
			var version = JSON.parse(req.responseText).protocolversion;
			if (version.minor < 6)
				alert("Your JOSM installation does not yet support load_data requests. Please update JOSM to version 7643 or newer");
		}
	};

	return {
		"openOsmArea": openOsmArea,
		"importPoint": importPoint,
	};
})();

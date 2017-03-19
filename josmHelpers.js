var josmHelper = (function()
{
	var josmUrl = "http://localhost:8111/";
	var openOsmArea = function(area)
	{
		var url = josmUrl + "load_and_zoom" + area;
		var req = new XMLHttpRequest();
		req.onreadystatechange = function()
		{
			if (req.readyState != 4)
				return;
			else if (req.status != 200)
				testJosmVersion();
		}
		req.open("GET", url, true);
		try
		{
			req.send(null);
		}
		catch (e)
		{
			testJosmVersion();
		}
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
			if (!point.properties[tag.key])
				continue;
			xml += "<tag k='" + escapeXML(tag.key) + "' v='" + escapeXML(point.properties[tag.key]) + "'/>"
		}
		xml += "</node>"
		xml += "</osm>"

		var req = new XMLHttpRequest();
		req.onreadystatechange = function()
		{
			if (req.readyState != 4)
				return;
			else if (req.status != 200)
				testJosmVersion();
		}
		req.open("GET", url + encodeURIComponent(xml), true);
		try
		{
			req.send(null);
		}
		catch (e)
		{
			testJosmVersion();
		}
	};

	var testJosmVersion = function() {
		var defaultAlert = "Ujistěte se prosím, že JOSM běží a je povoleno dálkové ovládání.";
		var req = new XMLHttpRequest();
		req.onreadystatechange = function()
		{
			if (req.readyState != 4)
				return;
			console.log(req.status);
			if (req.status == 0)
				alert(defaultAlert);
			else if (req.status == 200)
			{
				var version = JSON.parse(req.responseText).protocolversion;
				if (version.minor < 6)
					alert("Vaše instalace JOSM nepodporuje požadavek load_data. Prosím, aktualizujte JOSM na verzi 7643 nebo novější");
			}
		}
		req.open("GET", josmUrl + "version", true);
		try
		{
			req.send(null);
		}
		catch (e)
		{
			alert(defaultAlert);
		}
	};

	return {
		"openOsmArea": openOsmArea,
		"importPoint": importPoint,
	};
})();

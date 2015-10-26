var htmlHelper = (function()
{
	var wikiUrl = "http://wiki.openstreetmap.org/wiki/";

	var addDataset = function (country, id)
	{
		var displayname = datasets[country][id].name;
		if (!document.getElementById(country + "Section"))
		{
			var settingsSection = document.getElementById("datasetSection");
			var innerHTML = settingsSection.innerHTML;
			innerHTML += '<div class="countryHeader" onclick="htmlHelper.collapseSection(\'' + country + '\')">&nbsp;&nbsp;' +
					country +
					' <small><a title="OpenStreetMap wiki" href="' + wikiUrl + 'POI_Importer/Datasets/' + country + '">info</a></small>' +
					'<div class="collapser" id="' + country + 'Collapser"></div>' +
					'</div>' +
					"<div id='" + country + "Section'></div>";
			settingsSection.innerHTML = innerHTML;
			collapseSection(country);
		}
		var section = document.getElementById(country + "Section");
		var innerHTML = section.innerHTML;
		innerHTML += '&nbsp;&nbsp;' +
			'<input type="checkbox" id="' + id + 'Dataset" onchange="toggleDataset(\'' + id + '\',this)" /> ' +
			'<label for="' + id + 'Dataset">' + displayname + '</label> ' +
			'<small><a title="OpenStreetMap wiki" href="' + wikiUrl + 'POI_Importer/Datasets/' + country + '/' + displayname + '">info</a></small>' +
			'<br/>';
		section.innerHTML = innerHTML;
	};

	var getPopup = function (datasetName, tileName, idx)
	{
		var point = tiledData[datasetName][tileName].data[idx];
		var settings = datasetSettings[datasetName];
		var area = "?left="   + (point.coordinates.lon - 0.001) +
			"&right="         + (point.coordinates.lon + 0.001) +
			"&top="           + (point.coordinates.lat + 0.001) +
			"&bottom="        + (point.coordinates.lat - 0.001);
		var popupHtml = "<table style='border-collapse:collapse'>" +
			"<tr>" + 
			"<th colspan='3'><a onclick='josmHelper.importPoint(\""+datasetName+"\",\""+tileName+"\",\""+idx+"\")' title='Import point in JOSM'>Import Data</a></th>" +
			"<th colspan='3'><a onclick='josmHelper.openOsmArea(\""+area+"\")' title='Open area in JOSM'>OSM Data</a></th>" +
			"</tr>";

		for (var t = 0; t < settings.tagmatch.length; t++)
		{
			var tag = settings.tagmatch[t];
			if (!point.properties[tag.key])
				continue;
			var score = 0;
			if (point.osmElement && point.osmElement.tags)
				score = comparisonAlgorithms[tag.algorithm || "equality"](
					point.properties[tag.key],
					point.osmElement.tags[tag.key]) * (tag.importance || 1);
			var colour = hslToRgb(score / 3, 1, 0.8);
			popupHtml += "<tr style='background-color:" + colour + ";'><td>";
			popupHtml += "<b>" + tag.key + "</b></td><td> = </td><td> " + point.properties[tag.key];
			popupHtml += "</td><td>";
			popupHtml += "<b>" + tag.key + "</b></td><td> = </td><td>";
			if (point.osmElement && point.osmElement.tags && point.osmElement.tags[tag.key])
				popupHtml += point.osmElement.tags[tag.key];
			else
				popupHtml += "N/A";

			popupHtml += "</td></tr>";
		}
		popupHtml += "</table>";
		return popupHtml;
	};

	var displayComments = function(comments, dataset, feature)
	{
		var div = document.getElementById("commentsContent");
		div.innerHTML = "";
		for (var i = 0; i < comments.length; i++)
		{
			var time = new Date(+comments[i].timestamp * 1000);
			var comment = div.appendChild(document.createElement("div"));
			comment.setAttribute("class", "comment");
			comment.appendChild(document.createElement("b"))
				.appendChild(document.createTextNode(comments[i].username + " "));
			comment.appendChild(document.createElement("small"))
				.appendChild(document.createTextNode(time.toLocaleString()));
			comment.appendChild(document.createElement("br"));
			comment.appendChild(document.createTextNode(comments[i].comment));
		}
		if (loggedInToOsm)
		{
			document.getElementById("newComment").style.display = "block";
			document.getElementById("newCommentButton").onclick = function()
			{
				addComment(dataset, feature);
			}
		}
	};

	var clearComments = function()
	{
		document.getElementById("commentsContent").innerHTML = "Select a feature to see comments.";
		document.getElementById("newComment").style.display = "none";
	};

	var collapseSection = function (id)
	{
		var section = document.getElementById(id + "Section");
		var collapser = document.getElementById(id + "Collapser");
		if (!section || !collapser)
			return;
		if (section.style.display == "none")
		{
			section.style.display = "block";
			collapser.innerHTML = "\u25b2";
		}
		else
		{
			section.style.display = "none";
			collapser.innerHTML = "\u25bc";
		}
	};

	return {
		"addDataset": addDataset,
		"collapseSection": collapseSection,
		"getPopup": getPopup,
		"displayComments": displayComments,
		"clearComments": clearComments,
	};
})();

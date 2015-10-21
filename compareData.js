function compareData(tiles, osmData)
{
	// split per tile
	var i = -1;
	for (var d = 0; d < tiles.length; d++)
	{
		tiles[d].osmData = [];
		while (!osmData[++i].count)
			tiles[d].osmData.push(osmData[i]);
	}

	
	for (var d = 0; d < tiles.length; d++)
	{
		var data = tiledData[tiles[d].datasetName][tiles[d].tileName].data;
		var settings = datasetSettings[tiles[d].datasetName];
		var maxScore = 1;
		for (var t = 0; t < settings.tagmatch.length; t++)
			maxScore += settings.tagmatch[t].importance || 1;
		for (var p = 0; p < data.length; p++)
		{
			var point = data[p];
			point.maxScore = maxScore;
			point.score = 0;
			point.osmElement = {};

			var bestScore = 0;
			for (var i = 0; i < tiles[d].osmData.length; i++)
			{
				var element = tiles[d].osmData[i];
				if (geoHelper.getDistance(element.center || element, point.coordinates) > settings.dist)
					continue;

				var score = 1;
				for (var t = 0; t < settings.tagmatch.length; t++)
				{
					var tag = settings.tagmatch[t];
					score += comparisonAlgorithms[tag.algorithm || "equality"](
						point.properties[tag.datakey],
						element.tags[tag.osmkey]) * (tag.importance || 1);
				}
				if (score > bestScore)
				{
					point.osmElement = element;
					point.score = score;
					bestScore = score;
				}
			}
			displayPoint(tiles[d].datasetName, tiles[d].tileName, p);
		}
	}
}

// every comparison algorithm returns a value between 0 and 1
// where 0 is non-matching and 1 is perfectly matching
// TODO alternative algorithms: levenshtein, opening hours equivalence, ...:
var comparisonAlgorithms = {
	"equality": function(v1, v2)
	{
		if (v1 == v2)
			return 1;
		return 0;	
	},
	/**
	 * Checks if all elements of the semicolumn separated list v1 are in v2
	 */
	"inList": function(v1, v2)
	{
		if (!v1 || !v2)
			return false;
		var l1 = v1.split(";");
		var l2 = v2.split(";");
		for (var i = 0; i < l1.length; i++)
			if (l2.indexOf(l1[i]) == -1)
				return false;
		return true;
	},
	/**
	 * Checks if two lists contain the same elements (not neccesarily the same order)
	 */
	"equalList": function(v1, v2)
	{
		return comparisonAlgorithms.inList(v1, v2) && comparisonAlgorithms.inList(v2, v1);
	},
	"presence": function(v1, v2)
	{
		if (v1 != null && v2 != null)
			return 1;
		return 0;
	},
};


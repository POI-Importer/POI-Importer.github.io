/**
 * Different datasets the tool can use
 *
 * The first-level keys are country names, in English,
 * as they will appear in the app
 *
 * The second level names are database identifiers.
 * These ids are used in the url, so should be as short as possible
 *
 * The name of a database will be visible in the app, and may be localised
 * The url can be a relative url, or an absolute one (starting with http:)
 * Relative URLs make testing on a local server easier.
 */
var datasets = {
	"Belgium":
	{
		"BE_dl":
		{
			"url": "datasets/belgium-haltes-de-lijn/", 
			"name": "Haltes De Lijn",
		},
	},
	"Italy": {
		"IT_fuel":
		{
			"url": "datasets/Italia-stazioni-di-servizo/",
			"name": "Stazioni di servizo",
		}
	},
/*	"Norway" :
	{
		"NO_kg":
		{
			"url": "http://obtitus.github.io/barnehagefakta_osm_data/POI-Importer-data/dataset.json",
			"name": "Barnehagefakta fra Utdanningsdirektoratet",
		}
	}*/
};

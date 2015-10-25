# POI-Importer.github.io
Tool to import POI into the OSM database

## Contributing to the project

### Getting the code and data, and keeping it up to date

To check out the complete project, please run

`git clone --recursive https://github.com/POI-Importer/POI-Importer.github.io.git`

This will also download all data in all datasets available, and allow you to run the entire app locally.

To update the submodules (or add submodules if you checked out the project without any),
you can execute the following command:

`git submodule init && git submodule update`

### Requesting to add a new dataset

To request a new dataset, please open an issue and explain the dataset. Tell for which country the dataset is used,
and tell what name you want to use.

You will get a repository where you can commit your data and settings for the dataset.

After the repo is added, you can check out the project, or update it as mentioned above.

### Preparing the data

You should prepare the data as you would do for a data dump. In JOSM you can alter keys and tags so they match OSM
standards. There's one exception though: if the dataset has a unique identifier, it's best to keep that. It will
be used by the tool to add comments to POI.

Once you have the tags like you want, you can save the data as a geoJSON file.

### Adding data to a certain dataset repo

First you must create the `dataset.json` file, which will hold most settings (use the other datasets as example).
Most important is the `zoom` parameter. This is used to split the data in tiles,
and determines how big the tiles are. Tiles that are too big will take long to load, if tiles don't have enough 
data, users will have problems finding the POI. It is advised to have between 5 and 20 POI per tile.

When the data is ready, you can run the `tile_geojson` script as follows:

`node tile_geojson -d path/to/file/exported/from/josm.json -r datasets/name-of-repo`

This should normally create the different tiles under `datasets/name-of-repo/data/`

When the tiles are split, you can add the other settings to the `dataset.json` file, and test them.

* `zoom`: As explained above, it determines the density of the data tiles. When you want to change the zoom,
you must update the data too
* `query`: The overpass query used. Please be as specific as possible. If a dataset only includes POI of a
certain operator, add that to the query to minimise the size of the returned data.
* `icon`: The icon to use, fetched from https://www.mapbox.com/maki/
* `dist`: The distance in meters to check around a POI for a match.
* `id`: The unique identifier of features in the database. This is used to bind comments to the POI.
If the database doesn't have an identifier, then this key should not be used.
* `tagmatch`: List of keys to compare with OSM data.
 * `key`: Name of the key to compare
 * `algorithm`: The algorithm to use. The possible algorithms can be found at the bottom of this file: 
https://github.com/POI-Importer/POI-Importer.github.io/blob/master/compareData.js



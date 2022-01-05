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
  "České" :
  {
    "CZCSbnk":
    {
      "url": "datasets/Czech-ceska-sporitelna/",
      "name": "Pobočky České spořitelny"
    },
    "CZCSatm":
    {
      "url": "datasets/Czech-ceska-sporitelna-atm/",
      "name": "Bankomaty České spořitelny"
    },
    "CZEuroOil":
    {
      "url": "datasets/Czech-Cepro-EuroOil/",
      "name": "ČS EuroOil"
    },
    "CZECPbox":
    {
      "url": "datasets/Czech-ceska-posta-schranky/",
      "name": "Poštovní schránky"
    },
    "CZECPboxBrno":
    {
      "url": "datasets/Czech-ceska-posta-schranky-Brno/",
      "name": "Poštovní schránky Brno"
    },
    "CZEEKO-KOM":
    {
      "url": "datasets/Czech-EKO-KOM-kontejnery/",
      "name": "EKO-KOM: kontejnery"
    },
    "CZEzBoxy":
    {
      "url": "datasets/Czech-Zasilkovna-Z-BOXy/",
      "name": "Zásilkovna - Z-Boxy"
    }
  }
};

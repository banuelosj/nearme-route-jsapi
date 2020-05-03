require([
  "esri/views/MapView",
  "esri/Map",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
], function (MapView, Map, FeatureLayer, GraphicsLayer, Graphic) {
  const radius = 5;
  const distanceUnits = "miles";
  const graphicsLayer = new GraphicsLayer();

  const facilitiesLayer = new FeatureLayer({
    url:
      "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",
    outFields: ["*"],
  });

  const map = new Map({
    basemap: "streets",
    layers: [graphicsLayer],
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-118.165526, 34.032336],
    zoom: 12,
  });

  view.on("click", clickHandler);

  function clickHandler(event) {
    view.hitTest(event).then((response) => {
      if (response.results.length) {
        const graphic = response.results.filter((result) => {
          return result.graphic.layer === facilitiesLayer;
        })[0].graphic;
        console.log(graphic.attributes);
      } else {
        const mapPoint = view.toMap(response.screenPoint);
        findFacilities(mapPoint, facilitiesLayer);
      }
    });
  }

  // query nearby facilities within a certain radious
  function findFacilities(point, layer) {
    const query = layer.createQuery();
    query.returnGeometry = true;
    query.distance = radius;
    query.units = distanceUnits;
    query.outFields = ["*"];
    query.geometry = point;

    layer.queryFeatures(query).then((results) => {
      displayLocations(results.features);
    });
  }

  function displayLocations(features) {
    //clear existing graphics first
    graphicsLayer.removeAll();

    const locationSymbol = {
      type: "simple-marker",
      path:
        "M15.999 0C11.214 0 8 1.805 8 6.5v17l7.999 8.5L24 23.5v-17C24 1.805 20.786 0 15.999 0zM16 14.402A4.4 4.4 0 0 1 11.601 10a4.4 4.4 0 1 1 8.798 0A4.4 4.4 0 0 1 16 14.402z",
      color: "#0079C1",
      size: "15px",
    };

    features.forEach((feature) => {
      const graphic = new Graphic({
        geometry: feature.geometry,
        symbol: locationSymbol,
      });
      graphicsLayer.add(graphic);
    });
  }
});

require([
  "esri/views/MapView",
  "esri/Map",
  "esri/layers/FeatureLayer",
], function (MapView, Map, FeatureLayer) {
  const facilitiesLayer = new FeatureLayer({
    url:
      "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",
    outFields: ["*"],
  });

  const map = new Map({
    basemap: "gray-vector",
    layers: [facilitiesLayer],
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [106.79, 38.23],
    zoom: 3,
  });
});

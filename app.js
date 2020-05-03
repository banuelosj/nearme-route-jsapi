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
    basemap: "streets",
    layers: [facilitiesLayer],
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
      }
    });
  }
});

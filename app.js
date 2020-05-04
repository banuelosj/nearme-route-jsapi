require([
  "esri/views/MapView",
  "esri/Map",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/geometry/geometryEngine",
  "esri/geometry/Polyline"
], function (
  MapView,
  Map,
  FeatureLayer,
  GraphicsLayer,
  Graphic,
  geometryEngine,
  Polyline
) {
  const radius = 5;
  const distanceUnits = "miles";
  const graphicsLayer = new GraphicsLayer();

  const facilitiesLayer = new FeatureLayer({
    url:
      "https://services.arcgis.com/Wl7Y1m92PbjtJs5n/ArcGIS/rest/services/hospitalTestData/FeatureServer/0",
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
      } else {
        const mapPoint = view.toMap(response.screenPoint);
        addPointToMap(mapPoint);
        // create the buffer to display and for the query
        const buffer = addBuffer(mapPoint);
        findFacilities(buffer, facilitiesLayer, mapPoint);
      }
    });
  }

  function addPointToMap(point) {
    //clear existing graphics
    if (view.graphics.length > 0) {
      view.graphics.removeAll();
    }

    const locationSymbol = {
      type: "simple-marker",
      path:
        "M15.999 0C11.214 0 8 1.805 8 6.5v17l7.999 8.5L24 23.5v-17C24 1.805 20.786 0 15.999 0z",
      color: "#de2900",
      size: "35px",
    };

    const pointGraphic = new Graphic({
      geometry: point,
      symbol: locationSymbol,
    });

    view.graphics.add(pointGraphic);
  }

  function addBuffer(point) {
    const polySym = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: [140, 140, 222, 0.5],
      outline: {
        color: [0, 0, 0, 0.5],
        width: 2,
        style: "dash",
      },
    };

    const buffer = geometryEngine.geodesicBuffer(point, radius, distanceUnits);

    const bufferGraphic = new Graphic({
      geometry: buffer,
      symbol: polySym,
    });

    view.graphics.add(bufferGraphic);
    return buffer;
  }

  // query nearby facilities within a certain radious
  function findFacilities(buffer, layer, centerPoint) {
    const query = layer.createQuery();
    query.returnGeometry = true;
    //  query.distance = radius;
    //  query.units = distanceUnits;
    query.outFields = ["*"];
    query.geometry = buffer;

    layer.queryFeatures(query).then((results) => {
      if (results.features.length) {
        displayLocations(results.features);
        populateCards(results.features, centerPoint);
      } else {
        console.log("no results returned from query");
      }
    });
  }

  function displayLocations(features) {
    //clear existing graphics first
    graphicsLayer.removeAll();

    const facilitySymbol = {
      type: "simple-marker",
      path:
        "M15.999 0C11.214 0 8 1.805 8 6.5v17l7.999 8.5L24 23.5v-17C24 1.805 20.786 0 15.999 0zM16 14.402A4.4 4.4 0 0 1 11.601 10a4.4 4.4 0 1 1 8.798 0A4.4 4.4 0 0 1 16 14.402z",
      color: "#0079C1",
      size: "15px",
    };

    features.forEach((feature) => {
      const graphic = new Graphic({
        geometry: feature.geometry,
        symbol: facilitySymbol,
      });
      graphicsLayer.add(graphic);
    });
  }

  function populateCards(features, centerPoint) {
    const cardArray = [];
    const cardsList = document.getElementById('cardsList');
    cardsList.innerHTML = '';
    let card = '';

    for (let i = 0; i < features.length; i++) {
      const attrs = features[i].attributes;
      const locationGeometry = features[i].geometry;
      const distanceToRadius = getDistance(centerPoint, locationGeometry).toFixed(2);
      //getDistance(centerPoint, features[i].geometry);
      card = `
         <div class="card card-wide card-bar-blue" >
          <div class="card-content" style="cursor: pointer;" id=card${i}>
              <h4 class="trailer-half">${attrs.NAME}</h4>
              <p>FIPS: ${attrs.STCTYFIPS}</p>
              <p>${distanceToRadius} miles</p>
              <a href="https://www.google.com/maps/search/?api=1&query=${locationGeometry.latitude},${locationGeometry.longitude}" class="btn btn-fill leader-1">Directions</a>
          </div>
         </div>
     `;
      cardArray.push(card);
      cardsList.innerHTML += card;
    }
    initClickListener(cardsList);
  }

  function initClickListener(cardsList) {
    cardsList.addEventListener('click', (evt) => {
      console.log(evt);
    });
  }

  /*** 
     * To calculate distance between two points using geodesic length
     * Need to create a polyline between the two points, then calculate
     * The geodesic lenght of the polyline
    ***/
  function getDistance(centerPoint, facilityLocation) {
    var polyline = new Polyline({
      paths: [
        [centerPoint.longitude, centerPoint.latitude],
        [facilityLocation.longitude, facilityLocation.latitude]
      ],
      spatialReference: {wkid: 4326}
    });

    return geometryEngine.geodesicLength(polyline, "miles");
  }

});

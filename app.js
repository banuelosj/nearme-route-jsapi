require([
  "esri/views/MapView",
  "esri/Map",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/geometry/geometryEngine",
  "esri/geometry/Polyline",
  "esri/geometry/Point",
  "esri/widgets/Search",
  "esri/widgets/Locate",
], function (
  MapView,
  esriMap,
  FeatureLayer,
  GraphicsLayer,
  Graphic,
  geometryEngine,
  Polyline,
  Point,
  Search,
  Locate
) {
  let radius = 5;
  let distanceUnits = "miles";
  let currentPointLocation = null;
  const cardMap = new Map();

  const facilityGraphicsLayer = new GraphicsLayer();
  let graphicsLayerView = null;
  let highlight;

  const facilitiesLayer = new FeatureLayer({
    url:
      "https://services.arcgis.com/Wl7Y1m92PbjtJs5n/ArcGIS/rest/services/hospitalTestData/FeatureServer/0",
    outFields: ["*"],
  });

  const map = new esriMap({
    basemap: "streets",
    layers: [facilityGraphicsLayer],
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-118.165526, 34.032336],
    zoom: 12,
    highlightOptions: {
      color: "orange",
    },
  });

  const nearMeBtn = document.getElementById("nearMeBtn");
  const locateBtn = new Locate({
    view: view,
    scale: 50000,
  });

  nearMeBtn.onclick = function (evt) {
    searchNearMe(evt);
  };

  const searchWidget = new Search({
    view: view,
  });

  view.when(() => {
    view.ui.add(searchWidget, "top-right");
    view.ui.add(nearMeBtn, "top-left");
    searchWidget.on("search-complete", searchHandler);

    view.whenLayerView(facilityGraphicsLayer).then((layerView) => {
      graphicsLayerView = layerView;
    });
  });

  function searchHandler(searchResult) {
    if (searchResult.results.length) {
      const searchPoint = searchResult.results[0].results[0].feature.geometry;
      addPointToMap(searchPoint);
      // create the buffer to display and for the query
      const buffer = addBuffer(searchPoint);
      findFacilities(buffer, facilitiesLayer, searchPoint);
    } else {
      console.log("no search results found");
    }
  }

  view.on("click", clickHandler);

  function clickHandler(event) {
    view.hitTest(event).then((response) => {
      if (highlight) {
        highlight.remove();
        highlight = null;
      }

      if (response.results.length) {
        const graphic = response.results.filter((result) => {
          return result.graphic.layer === facilityGraphicsLayer;
        })[0].graphic;

        highlight = graphicsLayerView.highlight(graphic);
      } else {
        if (highlight) {
          highlight.remove();
          highlight = null;
        }
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
      size: "30px",
    };

    const pointGraphic = new Graphic({
      geometry: point,
      symbol: locationSymbol,
    });

    view.graphics.add(pointGraphic);
  }

  function addBuffer(point) {
    currentPointLocation = point;

    const polySym = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: [140, 140, 222, 0.2],
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
        displayLocations(results.features, centerPoint);
        populateCards(results.features, centerPoint);
      } else {
        // clear the panel
        const cardList = document.getElementById("cardsList");
        const panelDiv = document.getElementById("panelTitle");
        panelDiv.innerHTML = `Sorry no hospitals founds within ${radius} ${distanceUnits}.`;
        cardList.innerHTML = "";
        console.log("no results returned from query");

        // clear the graphics
        facilityGraphicsLayer.removeAll();
      }
    });
  }

  function displayLocations(features, centerPoint) {
    //clear existing graphics first
    facilityGraphicsLayer.removeAll();

    const facilitySymbol = {
      type: "simple-marker",
      path:
        "M15.999 0C11.214 0 8 1.805 8 6.5v17l7.999 8.5L24 23.5v-17C24 1.805 20.786 0 15.999 0zM16 14.402A4.4 4.4 0 0 1 11.601 10a4.4 4.4 0 1 1 8.798 0A4.4 4.4 0 0 1 16 14.402z",
      color: "#0079C1",
      size: "25px",
    };

    features.forEach((feature) => {
      const distanceToRadius = getDistance(
        centerPoint,
        feature.geometry
      ).toFixed(2);

      const graphic = new Graphic({
        geometry: feature.geometry,
        symbol: facilitySymbol,
        attributes: feature.attributes,
        popupTemplate: {
          title: `<b>{NAME}</b>`,
          content: `
            <p><b>ID:</b> {STCTYFIPS}</p>
            <p>${distanceToRadius} ${distanceUnits}</p>
            <a href="https://www.google.com/maps/search/?api=1&query=${feature.geometry.latitude},${feature.geometry.longitude}" target="_blank"><u>Directions</u></a>
          `,
        },
      });
      facilityGraphicsLayer.add(graphic);
    });
  }

  function populateCards(features, centerPoint) {
    const cardArray = [];
    cardMap.clear();
    const cardsList = document.getElementById("cardsList");
    const panelTitle = document.getElementById("panelTitle");
    //populate panel title with results
    const panelText = `
      There is a total of ${features.length} hospitals within ${radius} ${distanceUnits}.
   `;
    panelTitle.innerHTML = panelText;

    // clear existing children
    cardsList.innerHTML = "";
    let card = "";

    for (let i = 0; i < features.length; i++) {
      const attrs = features[i].attributes;
      const locationGeometry = features[i].geometry;
      const distanceToRadius = getDistance(centerPoint, locationGeometry);

      const cardDiv = document.createElement("div");
      cardDiv.id = `card${i}`;

      card = `
         <div class="card card-wide card-bar-blue">
            <div class="card-content" style="cursor: pointer;">
               <h4 class="trailer-half">${attrs.NAME}</h4>
               <p>FIPS: ${attrs.STCTYFIPS}</p>
               <p>${distanceToRadius.toFixed(2)} miles</p>
               <a href="https://www.google.com/maps/search/?api=1&query=${
                 locationGeometry.latitude
               },${
        locationGeometry.longitude
      }" class="btn btn-fill leader-1" target="_blank">Directions</a>
            </div>
         </div>
      `;

      cardDiv.innerHTML = card;

      // populate the Map to use for card click listener
      cardMap.set(cardDiv.id, {
        name: attrs.NAME,
        geometry: locationGeometry,
        card: cardDiv,
        distance: distanceToRadius,
      });
    }

    // sort the card map
    sortTheCards(cardMap, cardsList);
  }

  function sortTheCards(cardsMap, cardsList) {
    const sortedMap = new Map(
      [...cardsMap.entries()].sort((a, b) =>
        a[1].distance > b[1].distance ? 1 : -1
      )
    );

    // add the cards to the ui with event listeners
    sortedMap.forEach((value, key) => {
      cardsList.appendChild(value.card);
      initClickListener(value.card);
    });
  }

  function initClickListener(cardDiv) {
    cardDiv.addEventListener("click", (evt) => {
      const selectedCardGeometry = cardMap.get(cardDiv.id).geometry;
      const selectedGraphic = new Graphic({
        geometry: selectedCardGeometry,
      });

      if (highlight) {
        highlight.remove();
        highlight = null;
      }

      view.goTo({
        target: selectedGraphic,
        zoom: 18,
      });
      //view.graphics.removeAll();
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
        [facilityLocation.longitude, facilityLocation.latitude],
      ],
      spatialReference: { wkid: 4326 },
    });

    return geometryEngine.geodesicLength(polyline, "miles");
  }

  function searchNearMe(evt) {
    locateBtn.locate().then((result) => {
      if (result.coords) {
        const locationPoint = new Point({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        });

        addPointToMap(locationPoint);
        // create the buffer to display and for the query
        const buffer = addBuffer(locationPoint);
        findFacilities(buffer, facilitiesLayer, locationPoint);
      }
    });
  }

  /***
   * Code for handling the radius filter via modal
   ***/
  const modalBtn = document.getElementById("modalBtn");
  const modalDiv = document.getElementById("modalDiv");

  modalBtn.onclick = function () {
    // display radius filter
    modalDiv.className = "js-modal modal-overlay is-active";
  };

  // okay
  document.getElementsByClassName(
    "btn js-modal-toggle"
  )[0].onclick = function () {
    radiusFilter();
  };

  // cancel
  document.getElementsByClassName(
    "btn btn-clear js-modal-toggle"
  )[0].onclick = function () {
    modalDiv.className = "js-modal modal-overlay";
  };

  // handles the filter applied on the radius search
  function radiusFilter() {
    modalDiv.className = "js-modal modal-overlay";
    const selectDistance = document.getElementById("distanceSelect").value;
    const selectUnits = document.getElementById("unitsSelect").value;

    radius = selectDistance;
    distanceUnits = selectUnits;

    // clear to begin a new search
    if (view.graphics) {
      view.graphics.removeAll();
      facilityGraphicsLayer.removeAll();

      // set the new graphics with new radius
      addPointToMap(currentPointLocation);
      // create the buffer to display and for the query
      const buffer = addBuffer(currentPointLocation);
      findFacilities(buffer, facilitiesLayer, currentPointLocation);
    }
  }
});

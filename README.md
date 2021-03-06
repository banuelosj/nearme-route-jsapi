# nearme-route-jsapi

Application allows one to find the nearest hospitals, within a specified distance range. One can get the directions to the chosen hopital via google maps.

![Hospitals NearMe](https://github.com/banuelosj/nearme-route-jsapi/blob/master/app-screenshot.png)

## How to use the application

1. Use the [Search Widget](https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Search.html) to search for an address or use your current location.
2. A circle buffer will be displayed on the map with pin graphics that represent the hospitals within the chosen distance range.
3. Select one of the hospital cards on the left panel to zoom to the hospital.
4. Click on the pin graphic to view some information of the hospital, along with the ability to get directions to the location.
5. One can click directly on the map instead of searching for an address.
6. One can also click on the NearMe button to use one's current location.
7. Use the Refine Search button to change the buffer radius and units.

## Built With

- [ArcGIS JavaScript API](https://developers.arcgis.com/javascript/) - Using the 4.15 JavaScript API
- [Calcite-Web](http://esri.github.io/calcite-web/documentation/)
- [Semantic-UI](https://semantic-ui.com/)

## [Live Sample](https://banuelosj.github.io/nearme-route-jsapi/index.html)

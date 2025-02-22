import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { createElement, useEffect, useState } from "react";
import { handleRoutesResponse, updateRouteAttributes } from "./Utils";
import React from "react";
import AlternativeRouteTable from "./AlternativeRouteTable";

const logNode = "Google Maps Route Planner (React) widget: Directions component: ";

interface ARPaneProps {
    title: string;
}

interface directionsProps {
    route: any;
    mxObjectUpdateArray: any;
    ARPane: ARPaneProps;
} 

export interface DirectionRouteExtended extends google.maps.DirectionsRoute {
    distance: number;
    duration: number;
}
const Directions: React.FC<directionsProps> = (props) => {

    const routeObject = props.route
    console.debug(logNode + "routeObject: " + JSON.stringify(routeObject)); 
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] =
      useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] =
      useState<google.maps.DirectionsRenderer>();
    const [routes, setRoutes] = useState<DirectionRouteExtended[]>([]);
    const [routeIndex, setRouteIndex] = useState(0);
    const [paneVisible, setPaneVisible] = useState(false);
    const selected = routes[routeIndex];
    const leg = selected?.legs[0];
  

    const toggleARPaneVisibility = () => {
      let toggleText = "";
      paneVisible ? (toggleText = "Closing ") : (toggleText = "Opening ");
      console.debug(logNode + toggleText + "AR pane...");
      setPaneVisible(!paneVisible);
    };
    const closeARPane = () => {
        setPaneVisible(false);
    };

    // Initialize directions service and renderer
    useEffect(() => {
      if (!routesLibrary || !map) return;
      setDirectionsService(new routesLibrary.DirectionsService());
      setDirectionsRenderer(
        new routesLibrary.DirectionsRenderer({
          draggable: routeObject.draggable, // Make the route draggable based on setting
          map
        })
      );
    }, [routesLibrary, map, routeObject]);
  
    // Add the following useEffect to make markers draggable
    useEffect(() => {
      if (!directionsRenderer) return;
  
      // Add the listener to update routes when directions change
      const listener = directionsRenderer.addListener(
        'directions_changed',
        () => {
          const result = directionsRenderer.getDirections();
          if (result) {
            handleRoutesResponse(result.routes, routeObject, props, setRoutes);
          }
        }
      );
  
      return () => google.maps.event.removeListener(listener);
    }, [directionsRenderer]);
  
    // Use directions service
    useEffect(() => {
      if (!directionsService || !directionsRenderer) return;
        
      let wayPointsArray: string[] = [];
      routeObject.wayPointsArrayString.length > 0 ? routeObject.wayPointsArrayString.split("|") : [];
      const wayPointsArrayRoute: google.maps.DirectionsWaypoint[] = [];
      wayPointsArray.forEach((wayPoint: any) => {
          const wayPointObj = {
              location : wayPoint,
              stopover : true
          };
          wayPointsArrayRoute.push(wayPointObj);
      });
      const googleMapsDirectionsRequest: google.maps.DirectionsRequest = {
          origin: routeObject.addressFrom,
          destination: routeObject.addressTo,
          travelMode: routeObject.travelMode,
          avoidHighways: routeObject.avoidHighways,
          avoidFerries: routeObject.avoidFerries,
          avoidTolls: routeObject.avoidTolls,
          provideRouteAlternatives: routeObject.provideRouteAlternatives
      }
      if (routeObject.travelMode !== "TRANSIT" && wayPointsArrayRoute.length > 0 && wayPointsArrayRoute[0].location) {
          googleMapsDirectionsRequest.waypoints = wayPointsArrayRoute;
      }
      directionsService
        .route(googleMapsDirectionsRequest)
        .catch((status)=>{
            console.error(logNode + 'Cannot determine directions: ' + status);
            //@ts-ignore
            mx.ui.error("Cannot determine directions: " + status);
        })
        .then((response: google.maps.DirectionsResult) => {
            if (response.routes.length > 0){

              directionsRenderer.setDirections(response);
              handleRoutesResponse(response.routes, routeObject, props, setRoutes);
            } else {
              console.debug(logNode + 'no routes found');
            }
        });
      return () => directionsRenderer.setMap(null);
    }, [directionsService, directionsRenderer, routeObject]);
  
    // Update direction route
    useEffect(() => {
      if (!directionsRenderer) return;
      directionsRenderer.setRouteIndex(routeIndex);
      const routeSelected = routes[routeIndex];
      if (!routeSelected) return;
      updateRouteAttributes(routeSelected, routeObject, props);
    }, [routeIndex, directionsRenderer]);
  
    if (!leg) return null;

    const imgStyle = { height: "18px", width: "18px" };
    const closeBtnStyle = { "pointer-events": "none", display: "block" };
  
    return (
      routeObject.provideRouteAlternatives && (
        <div className={"googlemaps-routeplanner-alternativeroutes"}>
        <button
            draggable={"false"}
            title={props.ARPane.title}
            onClick={toggleARPaneVisibility}  
            aria-label={props.ARPane.title}
            type={"button"}
            className={"gm-control-active gm-layer-control gm-fullscreen-control"}
        >
            <img
                src={
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHwAAAB6CAYAAAB9RzejAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAQaSURBVHhe7dzNSuNQHIbxNlVQxJWL8QK8MxfOwo0ggohtRZeKGxfjLXhfLt2NKPQjk389DtacfLU2Oc37/CDYDOLUPj3pOTVNN47jDnRE7itEEFwMwcV4X8Ovrq667mYjBoMBE4sVSQV3sacfe42JiL4aqUO6PdCj0cjtoW28r+Hv7+/uFtqGSZsYgoshuBjvsuz09DTe3d11e43InKU3vWQMXdHqpqkR3ku2aGNj42OvpMc/j/bL2JKRLWMrGhBNBO8lz8KpPRMvLi66VaKPxiwXl1V38Flsd3tmPB5Hk8nE7WHV6gyeiu10ez07wqMOdQX3xk5eb+z/Z3jXqGrwXtWJVoLYAakSfBau4kSL2IEpG3wuXMnoxA5Q2eCpxXxBdGIHqlTwOI5T8YxFT7i9/4gdsFLBLepwOPS+Zdfv979GJ3bgSgU3RdGTL/b+N7EDVzq4yYuexE79O7HDUym4yYv+FbHDVDm4KYpO7HAtFNxkRSd22BYObr5HJ3b4fuSMF/sZSXz7k9dPxc484+Xu7i6OoqWep61lZxufn5/nngCxdqc4YTkMFTEEF0NwMQQXQ3Ax3uAHBwcdW/o0tTFDXx3vsgztxSFdDMHFEFwMwcUQXAzBxRBcDMHFeN94GQyG8evrX7dXv9vb29w/4mNxnAAhhkO6GIKLIbgYgoshuJhGZunb29udt7e3aDweTzMuKpA5S7+8vIy56pNf8nh2bm5ucpe0tY/wnZ2dztnZWdeCXl9fd+1OlvXw8BDbE8Q+8cKW3jY3N+3TP+EEt5GdHD3m7lASkJeVGtX2YH+ObLc7h9Os6lNLcN/I/jSZTKZ2OEI9KgWfTr3X9smVN7L7/T4TsJqVDr63t2enENv3ly6UN7KJ3YxSwS328fHxbGadbDbMC0tZbEZ2eEoFf3l5mfu+ougcxsNV9pCeipcVncN42MoGn7jLecz5Hp2RHb6ywU1e9Gj/1z4jew1UCW6yosdHv4+IvQaqBjfe6D7EDs8iwU1hdGKHadHgJjM6scO1THCTik7ssC0b3MyiJ1t31bFtjY/l/ERwY1dgnK56ZB8eHtpKwO4zW8ZmK6bkayY+iCDGnhUQQnAxBBfjDb61teVuoW1SwW15Zae7op28s3SL7m42ghn66niDo72YtIkhuBiCiyG4GIKLIbgYgoshuBjvGy9PT0/x8/Oz26vfyclJo+/0tRknQIjhkC6G4GIILobgYgguZu1m6U2fnBG6otXNWo3w+/t7+2Xs8+hsGVvRgFir4Jxrtzxew8UQXAzBxRBcDMHFEFwMwcUQXAzBxRBcDMHFEFwMwcUQXMxaBR+NRu4WFrVWwd0HFOw+s2VsRWe88EEEMfasgBCCiyG4GG9wrsTYXqngXImx3byzdK7E2F7e4GirTucf/Gk/K3MRV5IAAAAASUVORK5CYII="
                }
                style={imgStyle}
            ></img>
            <img
                src={
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHwAAAB6CAYAAAB9RzejAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAVfSURBVHhe7Z27T9xYFIftXaSkAkUpNg/IP5G02aShBQlCqqSioOcRoAkhBYKwUIME1aYKAWn4BwLUoUra3S020iaIPKDIZiVWjs/MvZOZm2vf43j8mDm/Tzoae2Y8tvz53Id9ufhBEHhADj+pVyAECBcGhAsDwoVhFd7f3x/4vl9YqMMAGWAV3t3drZZApxFbpP/sd+UaIHtQhwsDwoVRiPD/g7NqgPzJXbgWff36DUgvAOu99OHh4WBnZ6flDSktONynT6+rq6vBxMREfT/m5ybPt54HI3dHvN7ePvUOaOTNm78jz10dEm7G0NAQXQVBKKJlQb9X213zvlZWVur7ivqOjqe/P61/B2EP85yZkUuRHpe54+Pj/v179xMV7+HFgbAEh8yFu4pp4sXenloCWcMWTuJ0cOHI7uu7FlDdw71CQTpYwhvFhXUuSzpklxOncFMc1bku6RzZly9dgewCiBUeJS5OOkc2Zfbbd/9AdgE4M5xukNiwSefIvnjhIjK7QGKFk5TDw5fe3Nwj6uN9B0lfWFioiuZm9odPHyC7QJwZTnIeP56PlD47O1uVTiCzy49TOMGRjsxuD1jCCZf0KNAaLxds4URS6WiNl49EwgmudGR2OUksnHBJJ9nI7JISNra+C+7jUfrOw4dz4Sbftu3t7WNtawvarnZIzcejA49H3WGeMzNSD4Cg/nco3Zuff+SnzWxOX359fT3o6kLJYePk5KR6b0StWmnJiBctivhR2QRHOEjHD9XhJiRZByg3LREO2gcIFwaEC8Mq/Oys1niiRlSeAbLH2krf3NwMjo6O1Fr+0MMYtQhajFU46FxQhwsDwoUB4cKAcGFAuDAgXBgQLgwIF4b1xgsNXXr9+pVay5/t7W3cacsIq/DBwcFgd3dXreUPBkBkh7VI10OIGgc25BEge1CHCwPChQHhwihEOAY9FEdLhikngSSvra15Y2Njvu4N6P3oCyCulT4zMxOcO3derYFG/v382Xuy/CS+h0PCzchiYj4K+s2NjY1wF9/2NTAwUN8XvdYOqfl4dOAvT9xhnjMzcivSdWaPjo42XYGVSsVPOu9qeHEgLMEhF+EkM8zsajGu3mri6tUraglkTSLhJC5JJhJRma2hOrmxHgfZwhKuRU9PT3s3b/7Klk7fi8vsB1MPgqWlJcjOEXaGbz3b8hYXF/2Dg32fI50+j8tskr382zJk54xTOIkj2XdG7tTFuaRr2XGZDdnFECucxN26dbtJtiZKOq27inHILg5nhu/vR09tTdLpgtDSdWbHNdAgu1hihWsxcf8tcG/vRT3T0UArP84M50inTKd6HpldfpzCCY50Wz1PILPLBUs4wZFugswuH2zhRBLpyOxykkg4wZGOrleJsT1C4zwepc9rmzdvOzU55dw2KqJ+Uwcej7rDPGdmpBoAofvf4W9UG2xpM9v8PZNKpRJMTk55PT096h3QyF9//Om9//jeeu40qUe8aEmXfrnspZ1f1SUcpCdxHW5CgikwmW57kFq4BrLbg5YJB+0BhAsjVjg1ovIMkD1W4aenp2oJdBrWbhnoXFCHCwPChQHhwoBwYUC4MCBcGBAuDAgXBoQLw3qnjUaWHB8fq7X8iRrfDtJjFY6ZGDsXa5GOmRg7F9ThwoBwYUC4MCBcGBAujLYSTv8Tlf6mDREd6lRF0lbCz6s5Vm1dOgSvW4siXRgQLgwIFwaECwPChQHhwoBwYUC4MCBcGBAuDAgXBoQLA8KFAeHCaCvhX/77Un21zQ+D4M2Rk3omxlaiDxrj0rMDRbowIFwYEC4MCBcGhAvDKlzPxGg2+7MOkD2YiVEYKNJF4XlfAcXSg7PuKfCVAAAAAElFTkSuQmCC"
                }
                style={imgStyle}
            ></img>
        </button>
        {paneVisible && (
            <div className={"gm-layer-modal"} title={props.ARPane.title} aria-label={props.ARPane.title}>
                <div className={"gm-layer-modal-text"}>
                    {props.ARPane.title}
                    <div className="directions">
                        <AlternativeRouteTable
                            route={routes}
                            setRouteIndex={setRouteIndex}

                        >
                          </AlternativeRouteTable> 
                      </div>
                </div>
                <button
                    draggable="false"
                    data-dojo-attach-point="layerToggleModalClose"
                    title="Sluiten"
                    aria-label="Sluiten"
                    onClick={closeARPane}
                    type="button"
                    className="gm-ui-hover-effect gm-layer-modal-close"
                >
                    <img
                        src={
                            "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2215px%22%20height%3D%2215px%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23000000%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M19%206.41L17.59%205%2012%2010.59%206.41%205%205%206.41%2010.59%2012%205%2017.59%206.41%2019%2012%2013.41%2017.59%2019%2019%2017.59%2013.41%2012z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A"
                        }
                        style={closeBtnStyle}
                    ></img>
                </button>
            </div>
        )}
    </div>
      )
    ) 
  }

  // Wrap the component with React.memo and pass the custom comparison function
  export default Directions
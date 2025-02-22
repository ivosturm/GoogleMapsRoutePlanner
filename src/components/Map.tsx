import { ControlPosition, Map as GoogleMap, useApiIsLoaded, useMap  } from '@vis.gl/react-google-maps';
import React, { createElement, useCallback, useEffect, useState, Fragment, ReactNode } from "react";
import { ObjectItem, ListActionValue } from "mendix";

import InfoWindowComponent from "./InfoWindow";                                                    
import { DefaultMapTypeEnum } from "../../typings/GoogleMapsRoutePlannerProps";

import MapHandler from './MapHandler';
import { CustomMapControl } from './MapControl';
import { PositionProps } from './GoogleMapsContainer';
import Directions from './Directions';

export interface InfoWindowStateProps {
    name: string;
    position: PositionProps;
    pixelOffset?: [number, number];
    mxObject?: ObjectItem;
}

interface GoogleMapsPropsExtended {
    mapContainerStyle?: {
        width: string;
        height: string;
    };
    defaultLat: string;
    defaultLng: string;
    int_disableInfoWindow: boolean;
    int_onClick?: ListActionValue; 
    infoWindowWidget?: ReactNode;
    zoomToCurrentLocation: boolean;
    defaultMapType: DefaultMapTypeEnum;
    opt_drag: boolean;
    opt_mapcontrol: boolean;
    opt_scroll: boolean;
    opt_streetview: boolean;
    opt_zoomcontrol: boolean;
    opt_tilt: string;
    searchBoxEnabled: boolean;
    searchBoxPlaceholder?: string;
    searchBoxWidth: number;
    searchBoxHeight: number;
    styleArray: string;
    route:any;
    mxObjectUpdateArray: any;
}

interface MapState {
    center: PositionProps;
    bounds: google.maps.LatLngBounds;
    showingInfoWindow: boolean;
    infowindowObj: InfoWindowStateProps;
}

const logNode: string = "Google Maps Route Planner (React) widget: Map component ";

const Map: React.FC<GoogleMapsPropsExtended> = (props) => {
    
    let currentLocation: PositionProps;

    const isLoaded = useApiIsLoaded();
    const map = useMap();

    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

    const handleSearchBoxMounted = useCallback((searchBox: google.maps.places.SearchBox) => {  
        console.debug(logNode + "searchbox mounted!");   
        // Bias the Search
        map?.addListener("bounds_changed", () => {
            searchBox?.setBounds(map.getBounds() as google.maps.LatLngBounds);
        });

        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox?.addListener("places_changed", () => {
            console.debug(logNode + "searchbox places changed!");
            const places = searchBox.getPlaces();

            if (places?.length === 0) {
                return;
            }
            // For each place, get the icon, name and location.
            const bounds = new google.maps.LatLngBounds();
            places?.forEach((place: google.maps.places.PlaceResult) => {
                if (!place.geometry) {
                    console.debug(logNode + "returned place contains no geometry");
                    return;
                }

                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else if (place.geometry && place.geometry.location) {
                    bounds.extend(place.geometry.location);
                }
            });
            map?.fitBounds(bounds);
        });
    }, [map, setSelectedPlace]);

    const [state, setState] = useState<MapState>({
        center: {
            lat: Number(props.defaultLat),
            lng: Number(props.defaultLng)
        },
        bounds: {} as google.maps.LatLngBounds,
        showingInfoWindow: false,
        infowindowObj: {} as InfoWindowStateProps
    });

    useEffect(() => {
        if (isLoaded && map) {
            handleOnGoogleApiLoaded(map)
        }
    }, [isLoaded, map, props.route]);

    const onInfoWindowClose = () => {
        setState(prevState => ({
                    ...prevState,
                    showingInfoWindow: false,
                    infowindowObj: {} as InfoWindowStateProps
                }));
    };
    const handleOnGoogleApiLoaded = (map: google.maps.Map) => {
        console.debug(logNode + "handleOnGoogleApiLoaded called with isLoaded: " + isLoaded);
        // store map in state, so this function can be called a second time once the API and map are already loaded
        if (isLoaded) {
            if (
                props.route &&
                props.route.length &&
                props.route[0].isNew &&
                props.zoomToCurrentLocation
            ) {
                zoomToCurrentLocation(map);
            }
        }
    }

    const zoomToCurrentLocation = (map: google.maps.Map) => {
        navigator.geolocation.getCurrentPosition(
            geolocationCoordinates => {
                console.debug(
                    logNode + "current location: lat:" +
                        geolocationCoordinates.coords.latitude +
                        ", lng: " +
                        geolocationCoordinates.coords.longitude
                );
                const position = {
                    lat: geolocationCoordinates.coords.latitude,
                    lng: geolocationCoordinates.coords.longitude
                };
                // store current location in map component, to make sure it can be accessed in drawing manager as well
                currentLocation = position;

                map.setCenter(currentLocation);
            },
            (e) => {
                //@ts-ignore
                mx.ui.error("something went wrong with determining location: " + e.message, { modal: false });
                console.error(logNode + "something went wrong with determining location", e);
                
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    }

        return (
            <>
                {isLoaded ? (
                    <><GoogleMap
                        mapId={'DEMO_MAP_ID'} // advanced markers need this feature. 
                        defaultCenter={state.center}
                        defaultZoom={9}
                        zoomControl={props.opt_zoomcontrol}
                        zoomControlOptions={{
                            position: google.maps.ControlPosition.RIGHT_CENTER
                        }}
                        scrollwheel={props.opt_scroll}
                        streetViewControl={props.opt_streetview}
                        gestureHandling={"greedy"}
                        fullscreenControl={true}
                        mapTypeId={google.maps.MapTypeId[props.defaultMapType as keyof typeof google.maps.MapTypeId] || google.maps.MapTypeId.ROADMAP}
                        mapTypeControl={props.opt_mapcontrol}
                        mapTypeControlOptions={{
                            position: google.maps.ControlPosition.TOP_LEFT
                        }}
                        tilt={parseInt(props.opt_tilt.replace("d", ""), 10)}
                        disableDefaultUI={false}
                    >
                        <Directions
                            route={props.route} 
                            mxObjectUpdateArray={props.mxObjectUpdateArray}
                            ARPane={{title: "Alternative Routes"}}
                        ></Directions>
                        {state.showingInfoWindow && (
                            <InfoWindowComponent
                                onCloseClick={onInfoWindowClose}
                                name={state.infowindowObj.name}
                                position={state.infowindowObj.position}
                                pixelOffset={state.infowindowObj.pixelOffset}
                                infoWindowWidget={props.infoWindowWidget}
                                mxObject={state.infowindowObj.mxObject || ({} as ObjectItem)}
                            ></InfoWindowComponent>
                        )}
                        {props.searchBoxEnabled && (
                            <>
                                <CustomMapControl
                                    controlPosition={ControlPosition.TOP}
                                    onPlaceSelect={setSelectedPlace}
                                    onSearchBoxMounted={handleSearchBoxMounted}
                                    center={state.center}
                                    placeholder={props.searchBoxPlaceholder}
                                />
                                <MapHandler place={selectedPlace} />
                            </>
                        )}
                    </GoogleMap>
                    </>
                    ) : (
                        <div className="spinner" />
                    )}

        </>
    );
};

// Wrap the component with React.memo and pass the custom comparison function
export default Map;

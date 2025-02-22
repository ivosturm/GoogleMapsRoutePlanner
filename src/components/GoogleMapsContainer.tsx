/* eslint-disable linebreak-style */
/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable linebreak-style */
import { createElement, ReactNode } from "react";
import {
    ActionValue,
    EditableValue
} from "mendix";

import { APIProvider } from '@vis.gl/react-google-maps';

import Map from "./Map";

import {DefaultMapTypeEnum} from "../../typings/GoogleMapsRoutePlannerProps";
import React from "react";
import _ from "lodash";
import { hasAttributeChanged } from "./Utils";


type DataSource = "static" | "context" | "XPath" | "microflow";

const containerStyle = {
    width: "800px",
    height: "600px"
};

const logNode = "Google Maps Route Planner (React) widget: ";

export interface PositionProps {
    lat: number;
    lng: number;
}

export interface GoogleMapsWidgetProps {
    mapWidth: number;
    mapHeight: number;
    travelModeAttr?: EditableValue<string>;
    departureOrArrivalAttr?: EditableValue<string>;
    addressFromAttr?: EditableValue<string>;
    wayPointsArrayStringAttr?: EditableValue<string>;
    latitudeAttr?: EditableValue<Big>;
    longitudeAttr?: EditableValue<Big>;
    addressToAttr?: EditableValue<string>;
    arrivalDateTimeAttr?: EditableValue<Date>;
    departureDateTimeAttr?: EditableValue<Date>;
    avoidHighwaysAttr?: EditableValue<boolean>;
    avoidFerriesAttr?: EditableValue<boolean>;
    avoidTollsAttr?: EditableValue<boolean>;
    provideRouteAlternativesAttr?: EditableValue<boolean>;
    draggableAttr?: EditableValue<boolean>;
    durationAttr: EditableValue<Big>;
    distanceAttr: EditableValue<Big>;
    defaultMapType: DefaultMapTypeEnum;
    apiKey: string;
    defaultLat: string;
    defaultLng: string;
    dataSource: DataSource;
    disableInfoWindow: boolean;
    int_onClick?: ActionValue;
    infoWindowWidget?: ReactNode;
    zoomToCurrentLocation: boolean;
    opt_drag: boolean;
    opt_mapcontrol: boolean;
    opt_scroll: boolean;
    opt_streetview: boolean;
    opt_zoomcontrol: boolean;
    opt_tilt: string;
    styleArray: string;
    searchBoxEnabled: boolean;
    searchBoxPlaceholder?: string;
    searchBoxWidth: number;
    searchBoxHeight: number;
}

export interface GoogleMapsContainerState {
    map: google.maps.Map;
    isLoaded: boolean;
    editable: boolean;
}

interface GoogleMapsContainerProps extends GoogleMapsWidgetProps {
    route: any;
}


// Custom deep comparison function
const areEqual = (prevProps: GoogleMapsContainerProps, nextProps: GoogleMapsContainerProps) => {
    if ((prevProps.addressFromAttr && nextProps.addressFromAttr && hasAttributeChanged("addressFrom", prevProps.addressFromAttr, nextProps.addressFromAttr)) ||
        (prevProps.addressToAttr && nextProps.addressToAttr && hasAttributeChanged("addressTo", prevProps.addressToAttr, nextProps.addressToAttr)) ||
        (prevProps.wayPointsArrayStringAttr && nextProps.wayPointsArrayStringAttr && hasAttributeChanged("wayPoints", prevProps.wayPointsArrayStringAttr, nextProps.wayPointsArrayStringAttr)) ||
        (prevProps.latitudeAttr && nextProps.latitudeAttr && hasAttributeChanged("latitude", prevProps.latitudeAttr, nextProps.latitudeAttr)) ||
        (prevProps.longitudeAttr && nextProps.longitudeAttr && hasAttributeChanged("longitude", prevProps.longitudeAttr, nextProps.longitudeAttr)) ||
        (prevProps.travelModeAttr && nextProps.travelModeAttr && hasAttributeChanged("travelMode", prevProps.travelModeAttr, nextProps.travelModeAttr)) ||
        (prevProps.provideRouteAlternativesAttr && nextProps.provideRouteAlternativesAttr && hasAttributeChanged("provideRouteAlternatives", prevProps.provideRouteAlternativesAttr, nextProps.provideRouteAlternativesAttr)) ||
        (prevProps.draggableAttr && nextProps.draggableAttr && hasAttributeChanged("draggable", prevProps.draggableAttr, nextProps.draggableAttr)) ||
        (prevProps.departureOrArrivalAttr && nextProps.departureOrArrivalAttr && hasAttributeChanged("departureOrArrival", prevProps.departureOrArrivalAttr, nextProps.departureOrArrivalAttr))
        ) {
        return false;
    } else {
        console.debug(logNode + "no important attribute seemed to have changed, but still allowing reload...");
        return true;
    }    
};

export const GoogleMapsContainer: React.FC<GoogleMapsContainerProps> = (props) => {
    // Initialize map dimensions
    if (props.mapWidth === 10000) {
        containerStyle.width = "100%";
    } else {
        containerStyle.width = props.mapWidth + "px";
    }
    if (props.mapHeight === 10000) {
        containerStyle.height = "100vh";
    } else {
        containerStyle.height = props.mapHeight + "px";
    }

    let travelMode = "DRIVING",
    departureOrArrivalFixed = "departure",
    addressFrom = "Parijsboulevard 143a, Utrecht",
    wayPointsArrayStringAttr = "Den Haag, Rotterdam",
    latitude = Number(props.defaultLng),
    longitude = Number(props.defaultLat),
    addressTo = "Amsterdam",
    arrivalDateTime = undefined,
    departureDateTime = undefined,
    avoidHighways = false,
    avoidFerries = true,
    avoidTolls = true,
    provideRouteAlternatives = false,
    draggable = false;

    travelMode = props.travelModeAttr ? String(props.travelModeAttr.value) : travelMode;
    departureOrArrivalFixed = props.departureOrArrivalAttr ? String(props.departureOrArrivalAttr.value) : departureOrArrivalFixed;
    addressFrom = props.addressFromAttr ? String(props.addressFromAttr.value) : addressFrom;
    wayPointsArrayStringAttr = props.wayPointsArrayStringAttr ? String(props.wayPointsArrayStringAttr.value) : wayPointsArrayStringAttr;
    latitude = props.latitudeAttr ? Number(props.latitudeAttr.value) : latitude;
    longitude = props.longitudeAttr ? Number(props.longitudeAttr.value) : longitude;
    addressTo = props.addressToAttr ? String(props.addressToAttr.value) : addressTo;
    arrivalDateTime = props.arrivalDateTimeAttr && props.arrivalDateTimeAttr.value ? new Date(props.arrivalDateTimeAttr.value as string | number | Date) : arrivalDateTime;
    departureDateTime = props.departureDateTimeAttr && props.departureDateTimeAttr.value ? new Date(props.departureDateTimeAttr.value as string | number | Date) : departureDateTime;
    avoidHighways = props.avoidHighwaysAttr ? Boolean(props.avoidHighwaysAttr.value) : avoidHighways;
    avoidFerries = props.avoidFerriesAttr ? Boolean(props.avoidFerriesAttr.value) : avoidFerries;
    avoidTolls = props.avoidTollsAttr ? Boolean(props.avoidTollsAttr.value) : avoidTolls;
    provideRouteAlternatives = props.provideRouteAlternativesAttr ? Boolean(props.provideRouteAlternativesAttr.value) : provideRouteAlternatives;
    draggable = props.draggableAttr ? Boolean(props.draggableAttr.value) : draggable;

    if (travelMode === "TRANSIT" && wayPointsArrayStringAttr.length > 0) {
        console.warn(logNode + "Waypoints are not supported for transit mode, hence ignored.");
        //@ts-ignore
        mx.ui.warning("Waypoints are not supported for transit mode, hence ignored.", { modal: false });
    }
    const routeObj = {
        travelMode,
        departureOrArrivalFixed,
        addressFrom,
        wayPointsArrayString: wayPointsArrayStringAttr,
        latitude,
        longitude,
        addressTo,
        arrivalDateTime,
        departureDateTime,
        avoidHighways,
        avoidFerries,
        avoidTolls,
        provideRouteAlternatives,
        draggable

    };
    console.debug(logNode + "routeObj: " + JSON.stringify(routeObj));

    const mxObjectUpdateArray = {
        arrivalDateTimeUpdateAttr: props.arrivalDateTimeAttr,
        departureDateTimeUpdateAttr: props.departureDateTimeAttr,
        durationUpdateAttr: props.durationAttr,
        distanceUpdateAttr: props.distanceAttr
    }

    return (
        <div style={{ height: containerStyle.height, width: containerStyle.width }} className={"googlemaps-custommarker"}>
            <APIProvider
                // 5-5-2024 Added async part. See: https://github.com/JustFly1984/react-google-maps-api/issues/3334 
                // 24-10-2024: Removed again since moved to new vis.gl/react-google-maps package
                apiKey={props.apiKey /* + "&loading=async"*/}
            >
                <Map
                    mapContainerStyle={containerStyle}
                    defaultLat={props.defaultLat}
                    defaultLng={props.defaultLng}
                    route={routeObj}
                    mxObjectUpdateArray={mxObjectUpdateArray}
                    int_disableInfoWindow={props.disableInfoWindow}
                    infoWindowWidget={props.infoWindowWidget}
                    zoomToCurrentLocation={props.zoomToCurrentLocation}
                    defaultMapType={props.defaultMapType}
                    opt_drag={props.opt_drag}
                    opt_mapcontrol={props.opt_mapcontrol}
                    opt_scroll={props.opt_scroll}
                    opt_streetview={props.opt_streetview}
                    opt_tilt={props.opt_tilt}
                    opt_zoomcontrol={props.opt_zoomcontrol}
                    styleArray={props.styleArray}
                    searchBoxEnabled={props.searchBoxEnabled}
                    searchBoxPlaceholder={props.searchBoxPlaceholder}
                    searchBoxWidth={props.searchBoxWidth}
                    searchBoxHeight={props.searchBoxHeight}
                ></Map>
            </APIProvider>    
        </div>
    );
}

// Wrap the component with React.memo and pass the custom comparison function
export default React.memo(GoogleMapsContainer, areEqual);

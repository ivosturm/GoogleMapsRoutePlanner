import { EditableValue } from "mendix";
import { Big } from "big.js";
import { DirectionRouteExtended } from "./Directions";


const logNode = "Google Maps Route Planner (React) widget: Utils: ";

export function updateAttribute(attributeValue: number | string | Date, attributeName: string, attributeType: string, attrUpdate?: EditableValue<Big | string | Date>) {
    // let coordinateParsed : Big | string;
    if (attrUpdate && isAttributeEditable(attributeName + "AttrUpdate", attrUpdate)) {
        // parse number returned from Google to correct type based on Mendix attribute
        if (attributeType === "string") {
            console.debug(logNode + "parsing attributeValue for " + attributeName + " to string " + attributeValue);
            attrUpdate.setValue(String(attributeValue));
        } // else means Big / Decimal
        else if (attributeType === "date"){
            console.debug(logNode + "parsing attributeValue for " + attributeName + " to Date " + attributeValue);
            attrUpdate.setValue(new Date(attributeValue));
        }
        else if (attributeType === "number" && typeof attributeValue === "number") {
            console.debug(logNode + "parsing attributeValue for " + attributeName + " to Big " + attributeValue);
            attrUpdate.setValue(new Big(attributeValue.toFixed(8)));
        }
    }
}

export function isAttributeEditable(propName: string, prop: EditableValue): boolean {
    let editable = false;
    if (prop && prop.status === "available" && !prop.readOnly) {
        editable = true;
        console.debug(logNode + propName + " is editable.");
    }
    return editable;
}

export function hasAttributeChanged(attributeName: string, prevProps: EditableValue<Big | string | Date | boolean>, nextProps: EditableValue<Big | string | Date | boolean>): boolean {
    if (prevProps.value !== nextProps?.value && nextProps?.status  === "available") {
        console.debug(logNode + "attribute "  + attributeName + " has changed to " + nextProps.value);
        return true;
    } else {
        return false;
    }
}

export function formatSecondsToHoursMinutes(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let result = '';
    if (hours > 0) {
        result += `${hours}h `;
    }
    if (minutes > 0) {
        result += `${minutes}min`;
    }
    return result.trim();
}

export function updateRouteAttributes(routeShortestDistance: DirectionRouteExtended, routeObject: any, props: any) {
    updateAttribute(routeShortestDistance.distance, "distance", "number", props.mxObjectUpdateArray.distanceUpdateAttr);
    updateAttribute(routeShortestDistance.duration, "duration", "number", props.mxObjectUpdateArray.durationUpdateAttr);

    // set departure time based on duration if arrival was fixed or not set
    if (routeObject.departureOrArrivalFixed === "Departure" && routeObject.departureDateTime) {
        console.debug(logNode + "arrivalDateTime needs to be set based on duration and departure time");
        let arrivalDateTime = routeObject.departureDateTime;
        arrivalDateTime.setSeconds(arrivalDateTime.getSeconds() + routeShortestDistance.duration);
        console.debug(logNode + "departureDateTime: " + arrivalDateTime);
        updateAttribute(arrivalDateTime, "departureDateTime", "date", props.mxObjectUpdateArray.arrivalDateTimeUpdateAttr);
    }
    // set arrital time based on duration if departure was fixed or not set
    if (routeObject.departureOrArrivalFixed === "Arrival" && routeObject.arrivalDateTime) {
        console.debug(logNode + "departureDateTime needs to be set based on duration and arrival time");
        let departureDateTime = routeObject.arrivalDateTime;
        departureDateTime.setSeconds(departureDateTime.getSeconds() - routeShortestDistance.duration);
        console.debug(logNode + "arrivalDateTime: " + departureDateTime);
        updateAttribute(departureDateTime, "arrivalDateTime", "date", props.mxObjectUpdateArray.departureDateTimeUpdateAttr);
    }
}

export function processAndSortRoutes(routes: google.maps.DirectionsRoute[]): DirectionRouteExtended[] {
    const routesExtended = routes as DirectionRouteExtended[];

    routesExtended.forEach((route) => {
        let routeDistanceTotal = 0,
            routeDurationTotal = 0;
        route.legs.forEach((leg) => {
            routeDistanceTotal += leg.distance?.value ?? 0;
            routeDurationTotal += leg.duration?.value ?? 0;
        });
        route.distance = routeDistanceTotal;
        route.duration = routeDurationTotal;
    });

    const sortedRoutes = routesExtended.sort((a, b) => {
        if (a.duration !== b.duration) {
            return a.duration - b.duration;
        }
        return a.distance - b.distance;
    });

    return sortedRoutes;
}

export function addLineBreakIfLargerThanMaxLength(inputString: string, maxLength: number): string {
    if (inputString.length <= maxLength) {
        return inputString;
    }
    else {
        return inputString.substring(0, maxLength) + "..."
    }
}

export function handleRoutesResponse(routes: google.maps.DirectionsRoute[], routeObject: any, props: any, setRoutes: (routes: DirectionRouteExtended[]) => void) {
    const sortedRoutes = processAndSortRoutes(routes);
    const routeSelected = sortedRoutes[0];
    if (routeSelected) {
        updateRouteAttributes(routeSelected, routeObject, props);
    }
    setRoutes(sortedRoutes);
}


/**
 * This file was generated from GoogleMapsRoutePlanner.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, EditableValue } from "mendix";
import { Big } from "big.js";

export type DefaultMapTypeEnum = "ROADMAP" | "SATELLITE" | "HYBRID" | "TERRAIN";

export type Opt_tiltEnum = "d0" | "d45";

export interface GoogleMapsRoutePlannerContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    mapHeight: number;
    mapWidth: number;
    apiAccessKey: string;
    defaultLat: string;
    defaultLng: string;
    defaultMapType: DefaultMapTypeEnum;
    zoomToCurrentLocation: boolean;
    travelModeAttr: EditableValue<string>;
    departureOrArrivalAttr: EditableValue<string>;
    addressFromAttr: EditableValue<string>;
    wayPointsArrayStringAttr: EditableValue<string>;
    latitudeAttr: EditableValue<Big>;
    longitudeAttr: EditableValue<Big>;
    addressToAttr: EditableValue<string>;
    arrivalDateTimeAttr: EditableValue<Date>;
    departureDateTimeAttr: EditableValue<Date>;
    avoidHighwaysAttr: EditableValue<boolean>;
    avoidFerriesAttr: EditableValue<boolean>;
    avoidTollsAttr: EditableValue<boolean>;
    provideRouteAlternativesAttr: EditableValue<boolean>;
    draggableAttr: EditableValue<boolean>;
    durationUpdateAttr: EditableValue<Big>;
    distanceUpdateAttr: EditableValue<Big>;
    infoWindowWidget?: ReactNode;
    disableInfoWindow: boolean;
    onClick?: ActionValue;
    searchBoxEnabled: boolean;
    searchBoxPlaceholder: string;
    searchBoxWidth: number;
    searchBoxHeight: number;
    opt_drag: boolean;
    opt_mapcontrol: boolean;
    opt_scroll: boolean;
    opt_streetview: boolean;
    opt_zoomcontrol: boolean;
    opt_tilt: Opt_tiltEnum;
    styleArray: string;
}

export interface GoogleMapsRoutePlannerPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    mapHeight: number | null;
    mapWidth: number | null;
    apiAccessKey: string;
    defaultLat: string;
    defaultLng: string;
    defaultMapType: DefaultMapTypeEnum;
    zoomToCurrentLocation: boolean;
    travelModeAttr: string;
    departureOrArrivalAttr: string;
    addressFromAttr: string;
    wayPointsArrayStringAttr: string;
    latitudeAttr: string;
    longitudeAttr: string;
    addressToAttr: string;
    arrivalDateTimeAttr: string;
    departureDateTimeAttr: string;
    avoidHighwaysAttr: string;
    avoidFerriesAttr: string;
    avoidTollsAttr: string;
    provideRouteAlternativesAttr: string;
    draggableAttr: string;
    durationUpdateAttr: string;
    distanceUpdateAttr: string;
    infoWindowWidget: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    disableInfoWindow: boolean;
    onClick: {} | null;
    searchBoxEnabled: boolean;
    searchBoxPlaceholder: string;
    searchBoxWidth: number | null;
    searchBoxHeight: number | null;
    opt_drag: boolean;
    opt_mapcontrol: boolean;
    opt_scroll: boolean;
    opt_streetview: boolean;
    opt_zoomcontrol: boolean;
    opt_tilt: Opt_tiltEnum;
    styleArray: string;
}

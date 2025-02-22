import  { Component, ReactNode, createElement } from "react";
import { GoogleMapsRoutePlannerContainerProps } from "../typings/GoogleMapsRoutePlannerProps";

import "./ui/GoogleMapsRoutePlanner.css";
import GoogleMapsContainer from "./components/GoogleMapsContainer";

export default class GoogleMapsCustomMarker extends Component<GoogleMapsRoutePlannerContainerProps> {

    render(): ReactNode {
        // block rendering if the data is not available yet
        if (this.props.addressFromAttr.status !== "available" || this.props.addressToAttr.status !== "available") {
            return <div>Loading...</div>;
        }
        return (
            <GoogleMapsContainer
                mapHeight={this.props.mapHeight}
                mapWidth={this.props.mapWidth}
                dataSource={"XPath"}
                defaultMapType={this.props.defaultMapType}
                travelModeAttr={this.props.travelModeAttr}
                departureOrArrivalAttr={this.props.departureOrArrivalAttr}
                addressFromAttr={this.props.addressFromAttr}
                wayPointsArrayStringAttr={this.props.wayPointsArrayStringAttr}
                latitudeAttr={this.props.latitudeAttr}
                longitudeAttr={this.props.longitudeAttr}
                addressToAttr={this.props.addressToAttr}
                arrivalDateTimeAttr={this.props.arrivalDateTimeAttr}
                departureDateTimeAttr={this.props.departureDateTimeAttr}
                avoidHighwaysAttr={this.props.avoidHighwaysAttr}
                avoidFerriesAttr={this.props.avoidFerriesAttr}
                avoidTollsAttr={this.props.avoidTollsAttr}
                draggableAttr={this.props.draggableAttr}
                provideRouteAlternativesAttr={this.props.provideRouteAlternativesAttr}
                durationAttr={this.props.durationUpdateAttr}
                distanceAttr={this.props.distanceUpdateAttr}
                disableInfoWindow={this.props.disableInfoWindow}
                int_onClick={this.props.onClick}
                infoWindowWidget={this.props.infoWindowWidget}
                opt_drag={this.props.opt_drag}
                opt_mapcontrol={this.props.opt_mapcontrol}
                opt_scroll={this.props.opt_scroll}
                opt_streetview={this.props.opt_streetview}
                opt_zoomcontrol={this.props.opt_zoomcontrol}
                opt_tilt={this.props.opt_tilt}
                apiKey={this.props.apiAccessKey}
                defaultLat={this.props.defaultLat}
                defaultLng={this.props.defaultLng}
                zoomToCurrentLocation={this.props.zoomToCurrentLocation}
                styleArray={this.props.styleArray}
                searchBoxEnabled={this.props.searchBoxEnabled}
                searchBoxPlaceholder={this.props.searchBoxPlaceholder}
                searchBoxWidth={this.props.searchBoxWidth}
                searchBoxHeight={this.props.searchBoxHeight}
                route={[]}
            />
        );
    }
}

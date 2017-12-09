/*

    GoogleMapsRoutePlanner
    ========================

    @file      : GoogleMapsRoutePlanner.js
    @version   : 0.0.1
    @author    : Ivo Sturm
    @date      : 17-11-2017
    @copyright : First Consulting
    @license   : Apache v2

    Documentation
    ========================
	
	Releases
	========================


*/

define([
    'dojo/_base/declare',
	"mxui/dom",
	"dojo/dom",	
	"dojo/on",
	'mxui/widget/_WidgetBase', 
	'dijit/_TemplatedMixin',
    'dojo/dom-style', 
	'dojo/dom-construct', 
	'dojo/_base/array', 
	'dojo/_base/lang',
    'GoogleMapsRoutePlanner/lib/jsapi', 
	'dojo/text!GoogleMapsRoutePlanner/widget/template/GoogleMapsRoutePlanner.html'
], function (declare, dom, dojoDom, on,_WidgetBase, _TemplatedMixin, domStyle, domConstruct, dojoArray, lang, googleMaps, widgetTemplate) {
    'use strict';

    return declare('GoogleMapsRoutePlanner.widget.GoogleMapsRoutePlanner', [_WidgetBase, _TemplatedMixin], {
        templateString: widgetTemplate,
		
		_progressID: null,
		_markersArr: [],
		_objects: [],
		_markerClusterer		: null,
		_handle: null,
        _contextObj: null,
        _googleMap: null,
        _routeCache: null,
        _googleScript: null,
        _defaultPosition: null,
		_splits	: {},
		_refs : null,
		_schema : [],
		_infowindow: null,
		_logNode: 'GoogleMapsRoutePlanner widget: ',
		_resizeTimer: null,

        postCreate: function () {
		
        },
        update: function (obj, callback) {
			// temporary workaround because of microflowtimer widget
			if (this._googleMap){
				return;
			}
            logger.debug(this.id + ".update");
			if (obj){
				this._contextObj = obj;			
            }
			
			this._resetSubscriptions();

            if (!google) {
                console.warn("Google JSAPI is not loaded, exiting!");
                callback();
                return;
            }

            if (!google.maps) {
                logger.debug(this.id + ".update load Google maps");
                var params = (this.apiAccessKey !== "") ? "key=" + this.apiAccessKey : "";
                if (google.loader && google.loader.Secure === false) {
                    google.loader.Secure = true;
                }
                window._googleMapsLoading = true;
                google.load("maps", 3, {
                    other_params: params,
                    callback: lang.hitch(this, function () {
                        logger.debug(this.id + ".update load Google maps callback");
                        window._googleMapsLoading = false;
						console.log(this._logNode + 'API not loaded yet -> trigger load');
                        this._loadMap(callback);
                    })
                });
            } else {
                if (this._googleMap) {
                    logger.debug(this.id + ".update has _googleMap");
					console.log(this._logNode + 'API loaded Google Maps object existing already -> add functionalities to map');
                    this._createRoute(callback);
                    google.maps.event.trigger(this._googleMap, "resize");
                } else {
                    logger.debug(this.id + ".update has no _googleMap");
                    if (window._googleMapsLoading) {
                        this._waitForGoogleLoad(callback);
						console.log(this._logNode + 'API loaded but Google Maps object non existing but loading -> wait');
                    } else {
                        this._loadMap(callback);
						console.log(this._logNode + 'API loaded but Google Maps object non existing -> load map');
                    }
                }
            }
        },
        resize: function (box) {
            if (this._googleMap) {
                if (this._resizeTimer) {
                    clearTimeout(this._resizeTimer);
                }
                this._resizeTimer = setTimeout(lang.hitch(this, function () {
                    //logger.debug(this.id + ".resize");
                    google.maps.event.trigger(this._googleMap, "resize");
                    /*if (this.gotocontext) {
                        this._goToContext();
                    }*/
                }), 250);
            }
        },
       _waitForGoogleLoad: function (callback) {
            logger.debug(this.id + "._waitForGoogleLoad");
            var interval = null,
                i = 0,
                timeout = 5000; // We'll timeout if google maps is not loaded
            var intervalFunc = lang.hitch(this, function () {
                i++;
                if (i > timeout) {
                    logger.warn(this.id + "._waitForGoogleLoad: it seems Google Maps is not loaded in the other widget. Quitting");
                    this._executeCallback(callback);
                    clearInterval(interval);
                }
                if (!window._googleMapsLoading) {
                    this._loadMap(callback);
                    clearInterval(interval);
                }
            });
            interval = setInterval(intervalFunc, 1);
        },
        uninitialize: function () {
            window[this.id + "_mapsCallback"] = null;
        },
        _resetSubscriptions: function () {
            if (this._handle) {
                this.unsubscribe(this._handle);
                this._handle = null;
            }
           if (this._contextObj) {

                this._handle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {

						// 20170611 - if contextobject is actual mapEntity object, no need to retrieve from DB again, since we have it already as context
						if (this._contextObj && this.mapEntity === this._contextObj.getEntity()){
							this.parseObjects([ this._contextObj ]);
						} else {
							this._loadMap();
						}
                    })
                });
				
            }
        },
        _loadMap: function (callback) {
			
			// load geocoder for reverse geocoding after dragging of marker
			this.geocoder = new google.maps.Geocoder();
			this.directionsService = new google.maps.DirectionsService();
			this.directionsDisplay = new google.maps.DirectionsRenderer();	
			
			this.distanceMatrixService = new google.maps.DistanceMatrixService;		
			
            domStyle.set(this.routeContainer, {
                height: this.mapHeight + 'px',
                width: this.mapWidth
            });

            this._defaultPosition = new google.maps.LatLng(this.defaultLat, this.defaultLng);

			var mapOptions = {
                zoom: 11,
                draggable: this.opt_drag,
                scrollwheel: this.opt_scroll,
                center: this._defaultPosition,
                mapTypeId: google.maps.MapTypeId[this.defaultMapType] || google.maps.MapTypeId.ROADMAP,
                mapTypeControl: this.opt_mapcontrol,
                mapTypeControlOption: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
                },
                streetViewControl: this.opt_streetview,
                zoomControl: this.opt_zoomcontrol,
                tilt: parseInt(this.opt_tilt.replace("d", ""), 10)
            };

            if (this.styleArray !== ""){
                mapOptions.styles = JSON.parse(this.styleArray);
            }
			
			if (this.borderColor !== ""){
				this.domNode.style.border = "2px solid " + this.borderColor;
			}
			
			this._googleMap = new google.maps.Map(this.routeContainer, mapOptions);
			
			this._createRoute();
			
			this._executeCallback(callback);

        },
        _createRoute: function () {

			// 20170613 - Added check whether no context object is available. Pan to context was not properly working.
			if (this._contextObj && this.xpathConstraint.indexOf("[id='[%CurrentObject%]']") > -1){	

				this.parseObjects( [this._contextObj] );		
			} else if (this._contextObj){
				this.parseObjects( [this._contextObj] );
			} else {
                if (this.updateRefresh) {

                    this._fetchFromDB();
					
                } else {
                    if (this._routeCache) {
                        this._fetchFromCache();

                    } else {
                        this._fetchFromDB();

                    }
                }
            }

        },
        _refreshMap: function (objs) {

			var arrivalDate = null,
			departureDate = null;
			
			if (objs[0].arrivalTime){
				arrivalDate = new Date(objs[0].arrivalTime);
			}
			if (objs[0].departureTime){
				departureDate = new Date(objs[0].departureTime);
			}

			var bounds = new google.maps.LatLngBounds();
            var panPosition = this._defaultPosition;
            var validCount = 0;
			var valueOfLat = null,
			valueOfLng = null,
			transitOpts = {
				arrivalTime: arrivalDate,
				departureTime: departureDate//,
				//modes: [transitMode1, transitMode2]
				//routingPreference: TransitRoutePreference
			};
			this.wayPoints = [];
			this.destinationsArray = [];
			
			// create waypoints array based on the pipeline delimiter to create separate waypoints to be used in determining route
			var wayPointsArray = [];
			
			if (objs[0].wayPointsArrayString.length !== 0){
				wayPointsArray = objs[0].wayPointsArrayString.split("|");
			}
			// waypoints are only allowed when not in TRANSIT mode. Give error if negative scenario occurs
			if (objs[0].travelMode === 'TRANSIT' && wayPointsArray.length > 0){
				console.error(this._logNode + " waypoints are not allowed in TRANSIT mode. Only for DRIVING, WALKING, BICYCLING.")
			} else {
				for (var f = 0 ; f < wayPointsArray.length ; f++){
					var wayPoint = {
						location : wayPointsArray[f],
						stopover : true
					}
					this.wayPoints.push(wayPoint);
					// add waypoints in order
					this.destinationsArray.push(wayPointsArray[f]);
				}
			}
			// add final destination as last waypoint
			this.destinationsArray.push(objs[0].addressTo);

			var origin = null;
			// if latitude and longitude > 0, use those, else use addressFrom
			if (objs[0].latitude && objs[0].latitude != 0 && objs[0].longitude && objs[0].longitude != 0) {
				origin = new google.maps.LatLng(objs[0].latitude, objs[0].longitude);
				this._geocodePosition(origin);
			} else {
				origin = objs[0].addressFrom;
			}

			// at least origin, address to and travelmode should be chosen
			if (origin && objs[0].addressTo && objs[0].travelMode && (arrivalDate || departureDate)){
						
				this.directionsDisplay.setMap(this._googleMap);	
				
				this.directionsService.route({
					origin: origin,
					destination: objs[0].addressTo,
					travelMode: objs[0].travelMode,
					waypoints : this.wayPoints
				  }, lang.hitch(this,function(response, status) {
					if (status === 'OK') {
					  this.directionsDisplay.setDirections(response);

					  this.distanceMatrixService.getDistanceMatrix({
							
							origins: [origin],
							destinations: this.destinationsArray,
							travelMode: objs[0].travelMode,
							unitSystem: google.maps.UnitSystem.METRIC,
							avoidHighways: objs[0].avoidHighways,
							avoidTolls: objs[0].avoidTolls,
							avoidFerries: objs[0].avoidFerries,
							transitOptions: transitOpts
						}, lang.hitch(this,function(response, status) {

						  if (status !== 'OK') {
							console.error(this._logNode + 'Cannot determine directions: ' + status);
						  } else if (response.rows[0].elements){
								var distance = 0,
								distanceTotal = 0,
								duration = 0,
								durationTotal = 0,
								allLegsOK = true;
								// iterate through all legs of the journey
								
								for (var g = 0 ; g < response.rows[0].elements.length ; g++){
									distance = response.rows[0].elements[g].distance.value;
									duration = response.rows[0].elements[g].duration.value;
									distanceTotal += distance;
									durationTotal += duration;
									if (response.rows[0].elements[g].status !== 'OK'){
										console.error(this._logNode + 'Cannot determine distance and duration: ' + status);
										allLegsOK = false;
									}									
								}
								// only if all legs are OK set attributes
								if (allLegsOK){
									this._contextObj.set(this.distanceAttr,distanceTotal);
									this._contextObj.set(this.durationAttr,durationTotal);
									// set departuretime based on duration if arrival time was fed
									if (arrivalDate){
										this._contextObj.set(this.departureTimeAttr,arrivalDate.setSeconds(arrivalDate.getSeconds() - duration));
									// if no arrivalDate was set, set arrivalDate based on departureDate
									} else if (departureDate){
										this._contextObj.set(this.arrivalTimeAttr,departureDate.setSeconds(departureDate.getSeconds() + duration));
									}
								} 
						  }
						}));
					} else {
					  window.alert(this._logNode + 'Directions request failed due to ' + status);
					}
				}));
			 
			} else {
				console.warn("At least an Address From, Address To, TravelMode and either an Arrival Time or Depature Time need to be provided!", false);
			}
			if (validCount < 2) {
                this._googleMap.setZoom(this.lowestZoom);
                this._googleMap.panTo(panPosition);
            } else {
                this._googleMap.fitBounds(bounds);
            }
			
			if (this._progressID) {
				mx.ui.hideProgress(this._progressID);
				this._progressID = null;
            }
			

			// needed to set map again if markers where still in cache. if they where in cache then map would be null.
			if (this._markersArr.length > 1){
				for (var q = 0 ; q < this._markersArr.length ; q++ ){
					this._markersArr[q].setMap(this._googleMap);
				}
			}

        },
        _fetchFromDB: function () {
			if (this.consoleLogging){
				console.log('fetching from db');
			}

            var xpath = '//' + this.mapEntity + this.xpathConstraint;
			
			this._schema = [];
			this._refs = {};
			
			this.loadSchema(this.addressFromAttr, 'addressFrom');
			this.loadSchema(this.addressToAttr, 'addressTo');
			this.loadSchema(this.travelModeAttr, 'travelMode');
			this.loadSchema(this.arrivalTimeAttr, 'arrivalTime');
			this.loadSchema(this.arrivalTimeAttr, 'departureTime');
			this.loadSchema(this.latitudeAttr, 'latitude');
			this.loadSchema(this.longitudeAttr, 'longitude');
			this.loadSchema(this.avoidHighwaysAttr, 'avoidHighways');
			this.loadSchema(this.avoidFerriesAttr, 'avoidFerries');
			this.loadSchema(this.avoidTollsAttr, 'avoidTolls');
			this.loadSchema(this.wayPointsArrayStringAttr, 'wayPointsArrayString');
			
			// With empty _schema whole object is being pushed, this is a temporary fix
			if (this._schema.length == 0){
				this._schema.push('createdDate');
			}

            this._removeRoute();

            if (this._contextObj) {
                xpath = xpath.replace('[%CurrentObject%]', this._contextObj.getGuid());
                mx.data.get({
                    xpath: xpath,
					filter      : {
						attributes  : this._schema,
						references	: this._refs
					},
                    callback: dojo.hitch(this, function(result){
						this.parseObjects(result)
					})
                });
            } else if (!this._contextObj && (xpath.indexOf('[%CurrentObject%]') > -1)) {
                console.warn(this._logNode + 'No context for xpath, not fetching.');
            } else {
                mx.data.get({
                    xpath: xpath,
					filter      : {
						attributes  : this._schema,
						references	: this._refs
					},
                    callback:  dojo.hitch(this, function(result){
						this.parseObjects(result)
					})
                });
            }
							
        },
		loadSchema : function (attr, name) {

			if (attr !== '') {
				this._splits[name] = attr.split("/");
				if (this._splits[name].length > 1)
					if (this._refs[this._splits[name][0]] && this._refs[this._splits[name][0]].attributes){
						this._refs[this._splits[name][0]].attributes.push(this._splits[name][2]);
					}
					else {
						this._refs[this._splits[name][0]] = {attributes : [this._splits[name][2]]};
					}
				else {
					this._schema.push(attr);
				}
			}
		}, 
		parseObjects : function (objs) {

			this._objects = objs;

			var newObjs = [];
			for (var i = 0; i < objs.length; i++) {

				var newObj = {};
				var entity = objs[i].getEntity();	
				var entityString = entity.substr(entity.indexOf('.')+1);		
				newObj['type'] = entityString;								
				newObj['addressFrom'] = this.checkRef(objs[i], 'addressFrom', this.addressFromAttr);
				newObj['addressTo'] = this.checkRef(objs[i], 'addressTo', this.addressToAttr);
				newObj['travelMode'] = this.checkRef(objs[i], 'travelMode', this.travelModeAttr);
				newObj['arrivalTime'] = objs[i].get(this.arrivalTimeAttr);
				newObj['departureTime'] = objs[i].get(this.departureTimeAttr);				
				newObj['longitude'] = objs[i].get(this.longitudeAttr);
				newObj['latitude'] = objs[i].get(this.latitudeAttr);
				newObj['avoidHighways'] = this.checkRef(objs[i], 'avoidHighways', this.avoidHighwaysAttr);
				newObj['avoidFerries'] = this.checkRef(objs[i], 'avoidFerries', this.avoidFerriesAttr);
				newObj['avoidTolls'] = this.checkRef(objs[i], 'avoidTolls', this.avoidTollsAttr);
				newObj['wayPointsArrayString'] = this.checkRef(objs[i], 'wayPointsArrayString', this.wayPointsArrayStringAttr);
				newObj['guid'] = objs[i].getGuid();						
				newObjs.push(newObj);
			}	
			if (this.consoleLogging){
					console.log(this._logNode + 'the MendixObjects retrieved:');
					console.dir(objs);
					console.log(this._logNode + 'the objects used for displaying on the map:');
					console.dir(newObjs);
			}
			// after creating the objects, trigger a refreshMap. This will also add the markers based on the newObjs	
			this._refreshMap(newObjs);

		},	
		checkRef : function (obj, attr, nonRefAttr) {
			if (this._splits && this._splits[attr] && this._splits[attr].length > 1) {
				var subObj = obj.getChildren(this._splits[attr][0]);
				return (subObj.length > 0)?subObj[0].get(this._splits[attr][2]):'';
			} else {

				return obj.get(nonRefAttr);
			}
		},		
        _fetchFromCache: function () {

			if (this.consoleLogging){
				console.log('fetching from cache');
			}

            if (!cached) {

                this._fetchFromDB();
            }

        },
        _removeRoute: function () {
            if (this._routeCache) {
                dojoArray.forEach(this._routeCache, function (route) {
                    route.setMap(null);
                });
            }

			
        },
        _getLatLng: function (obj) {
            var lat = obj.lat,
                lng = obj.lng;

            if (lat === "" && lng === "") {
                return this._defaultPosition;
            } else if (!isNaN(lat) && !isNaN(lng) && lat !== "" && lng !== "") {
                return new google.maps.LatLng(lat, lng);
            } else {
                return null;
            }
        },
		_geocodePosition: function (LatLng) {
					  
		  this.geocoder.geocode({
			latLng: LatLng
		  }, lang.hitch(this,function(results,status) {
			 if (this.consoleLogging){
				console.log(this._logNode + "results: ");
				console.dir(results);
				console.log(this._logNode + "status: " + status);
			 } 
			if (status === 'OK' && results.length > 0) {
				var formattedAddress = results[0].formatted_address;
				this._contextObj.set(this.addressFromAttr, formattedAddress);
			} else {
				console.error(this._logNode + 'Cannot determine address at this location for the following reason: ' + status);
			}
		  }));
		    
		},
        _execMf: function (mf, guid, cb) {
			if (this.consoleLogging){
				console.log(this._logNode + "_execMf");
			}
            if (mf && guid) {
                mx.data.action({
                    params: {
                        applyto: "selection",
                        actionname: mf,
                        guids: [guid]
                    },
                    store: {
                        caller: this.mxform
                    },
                    callback: lang.hitch(this, function (obj) {
                        if (cb && typeof cb === "function") {
                            cb(obj);
                        }
                    }),
                    error: lang.hitch(this,function (error) {
                        console.debug(this._logNode + error.description);
                    })
                }, this);
            }
        },
		_executeCallback: function (cb) {
            if (cb && typeof cb === "function") {
                cb();
            }
        }
		
    });
});

require(["GoogleMapsRoutePlanner/widget/GoogleMapsRoutePlanner"], function() {});

// The polygon lines drawing the bus routes on Google Map
var flightPath = [];
// The user's map markers
var markersArray = [];
// Google markers representing bus stops
var busStops = [];
// The array which must draw the bus polyline between stops
var waypts = [];
// For when the user selects a search preference for the map
var searchPreference;
// The loading window which also shows the search preferences
var infoWindow;


// Start the Google Map
function initialize() {

	var myLatlng = new google.maps.LatLng(53.350140, -6.266155);
	var myOptions = {
		zoom: 12,
		center: myLatlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		disableDefaultUI: true,
		clickableIcons: false
		}
	// Selected by 'onclick' by user
	var source;
	var destination;

	// For the loading icon when a user picks a source and destination
    infoWindow = new google.maps.InfoWindow({
          content: "<h1>Loading...</h1><img src='static/ajax-loader.gif' style='display: block; margin: 0 auto;'>"
        });
	
	var map = new google.maps.Map(document.getElementById("googleMap"), myOptions);

    // Listener for placing markers
	google.maps.event.addListener(map, 'click', function(event) {

		if (markersArray.length == 0) {
			source = event.latLng;
			placeMarker(source, map);
		}
		else if (markersArray.length == 1) {
			destination = event.latLng;
			placeMarker(destination, map);
			
			infoWindow.setPosition(markersArray[1].center);
			infoWindow.open(map);
		
			setTimeout(function(){
			getJpidBestRoute(map, source.lat(), source.lng(), destination.lat(), destination.lng());}, 1000);
		} else {
			resetGlobals();
		}
	})
}


// Find best possible route jpid, get coords of its stops and display them
function getJpidBestRoute(map, srcLat, srcLon, destLat, destLon) {

	var temp = new Date();
	var dateTime = [temp.toString(), temp.getDay(), temp.getHours(), temp.getMinutes(), temp.getSeconds()]
	
	$.ajax({
	  dataType: "json",
	  url: $SCRIPT_ROOT + "/best_route/" + srcLat + "/" + srcLon + "/" + destLat + "/" + destLon + "/" + searchPreference + "/" + dateTime,
	  async: true, 
	  success: function(data) {
		  
		  if (data == 'No Journey Found') {
			  errorHandleNoRoutes(); 
		  } else {
		for (var i = 0; i < data.length; i++) {
			information = data[i][0];
			jpid = data[i][1];
			var srcStop = data[i][2];
			var destStop = data[i][3];
			drawMapRoute(map, srcStop, destStop);
		}	
		  setTimeout(function(){formatInfoWindow(data);}, 1000);
		}
	  }
	});
}


// Catch error in infoWindow if user searches outside radius of Dublin
function errorHandleNoRoutes() {
	infoWindow.setContent("<h1>No Route Found</h1>");
}


// Draw polylines on Google Map
function drawMapRoute(map, srcStop, destStop) {

	var jqxhr2 = $.getJSON($SCRIPT_ROOT + "/gps_coords/" + jpid + "/" + srcStop + "/" + destStop, function(data) {

		var tempJourneyArray = [];

		_.forEach(data, function(stop) {
			tempJourneyArray.push({"lat": stop.Latitude, "lng": stop.Longitude});
		});
		// Add new array of lat/long objects to the 2d array
		waypts.push(tempJourneyArray);
	// Define the symbol, using one of the predefined paths ('CIRCLE')
	// supplied by the Google Maps JavaScript API.
	var lineSymbol = {
	  path: google.maps.SymbolPath.CIRCLE,
	  scale: 8,
	  strokeColor: '#FF0000'
	};
		  var tempFlightPath = new google.maps.Polyline({
		  path: waypts[waypts.length - 1],
		  geodesic: true,
		  strokeColor: '#FF0000',
		  strokeOpacity: 1.0,
		  strokeWeight: 2,
		  icons: [{
		  icon: lineSymbol,
		  offset: '100%'
			}]
		});
		// Add new flightpath to Array
		flightPath.push(tempFlightPath);
		// Change colour for each polyline
		if (flightPath.length == 1) {flightPath[0].strokeColor = '#0014ff';
									lineSymbol.strokeColor = '#0014ff';}
		if (flightPath.length == 2) {flightPath[1].strokeColor = '#ffd800';
									lineSymbol.strokeColor = '#ffd800';}
		
		flightPath[flightPath.length - 1].setMap(map);
		drawBusStops(waypts[waypts.length - 1], map);
		animateCircle(flightPath[flightPath.length - 1]);
	});
}


// Use the DOM setInterval() function to change the offset of the symbol
// at fixed intervals.
function animateCircle(line) {
	var count = 0;
	window.setInterval(function() {
		count = (count + 1) % 200;
		var icons = line.get('icons');
		icons[0].offset = (count / 2) + '%';
		line.set('icons', icons);
	}, 20);
}


// Draw the bus stop on each polyline
function drawBusStops(stops, map) {

	busStops.push([]);
    for (var i = 0; i < stops.length; i++) {
    var marker = new google.maps.Circle({
			strokeColor: '#000000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#edff11',
			fillOpacity: 0.35,
			map: map,
			center: stops[i],
			radius: 50
		  });
		if (busStops.length == 1) marker.fillColor = '#0014ff';
		if (busStops.length == 2) marker.fillColor = '#ffd800';
		if (busStops.length == 3) marker.fillColor = '#FF0000';
		// Add the next bus stop to the 2d array
		busStops[busStops.length - 1].push(marker);
	  }
}


// Format the infoWindow with addressses and Stop ID's colour coded
function formatInfoWindow(topThreeRoutes) {
	
    // Convert the JPID into a Line ID user can understand
    for (var i = 0; i < topThreeRoutes.length; i++) {
		// If it's a subroute then display that info
		var subRoute = topThreeRoutes[i][1][topThreeRoutes[i][1].length -1];
        var temp = topThreeRoutes[i][1].slice(0,4);
        if (temp.charAt(0) == "0") temp = temp.replace(0, "");
        if (temp.charAt(0) == "0") temp = temp.replace(0, "");
        topThreeRoutes[i][1] = temp;
		if (subRoute != "1") topThreeRoutes[i][1] = topThreeRoutes[i][1] + " (Sub-Route)";
    }
    // Convert the Time into hh:mm
    if (searchPreference == "searchByWalkingDistance") {
        for (var i = 0; i < topThreeRoutes.length; i++) {
            topThreeRoutes[i][0] = topThreeRoutes[i][0].toFixed(1) + "km";
        }
    }
    // Convert distance into km with one decimal point
    if (searchPreference == "searchByArrivalTime") {
        for (var i = 0; i < topThreeRoutes.length; i++) {
            topThreeRoutes[i][0] = topThreeRoutes[i][0].slice(0, 5);
        }
    }
	if (topThreeRoutes.length == 1) {
		infoWindow.setContent(
		"<h2 style='color:#0014ff;'>" + topThreeRoutes[0][1] + ": " + topThreeRoutes[0][0] + "</h2>" +
		topThreeRoutes[0][4] + "<br><b>Stop ID:</b> " + topThreeRoutes[0][2]);
	} else if (topThreeRoutes.length == 2) {
		infoWindow.setContent(
		"<h2 style='color:#0014ff;'>" + topThreeRoutes[0][1] + ": " + topThreeRoutes[0][0] + "</h2>" +
		topThreeRoutes[0][4] + "<br><b>Stop ID:</b> " + topThreeRoutes[0][2] +
		"<h2 style='color:#ffd800;'>" + topThreeRoutes[1][1] + ": " + topThreeRoutes[1][0] + "</h2>" +
		topThreeRoutes[1][4] + "<br><b>Stop ID:</b> " + topThreeRoutes[1][2]);
	} else {
		infoWindow.setContent(
		"<h2 style='color:#0014ff;'>" + topThreeRoutes[0][1] + ": " + topThreeRoutes[0][0] + "</h2>" +
			topThreeRoutes[0][4] + "<br><b>Stop ID:</b> " + topThreeRoutes[0][2] + 
		"<h2 style='color:#ffd800;'>" + topThreeRoutes[1][1] + ": " + topThreeRoutes[1][0] + "</h2>" +
			topThreeRoutes[1][4] + "<br><b>Stop ID:</b> " + topThreeRoutes[1][2] +
		"<h2 style='color:#FF0000;'>" + topThreeRoutes[2][1] + ": " + topThreeRoutes[2][0] + "</h2>" +
		topThreeRoutes[2][4] + "<br><b>Stop ID:</b> " + topThreeRoutes[2][2]);
		}
}


// Reset all the global variables 
function resetGlobals() {
	
	infoWindow.setContent("<h1>Loading...</h1><img src='static/ajax-loader.gif' style='display: block; margin: 0 auto;'>");
    for (var i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
    }
	
    for (var i = 0; i < waypts.length; i++) {
        for (var j = 0; j < waypts[i].length; j++) {
            busStops[i][j].setMap(null);
        }
    }
	
    markersArray = [];
    waypts = [];
    busStops = [];
    infoWindow.close();

    try {
        for (var i = 0; i < flightPath.length; i++) {
            flightPath[i].setMap(null);
        }
        flightPath = [];
    }
    catch (TypeError) {
        infoWindow.setContent("<h2>No Route Found</h2>");
        infoWindow.open(map);
    }
}


// So the user can place markers on the Map
function placeMarker(location, map) {
	var marker = new google.maps.Circle({
            strokeColor: '#000000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#3131ff',
            fillOpacity: 0.35,
            map: map,
            center: location,
            radius: 1000
          });

	if (markersArray.length == 0) marker.name = "source";
	if (markersArray.length == 1) marker.name = "destination";

	markersArray.push(marker);
}

var directionsDisplay;
var directionsService = new google.maps.DirectionsService();

var map;

var latdecString;
var lngdecString;
var distanceString;

var latdec;
var lngdec;
var distance;
var start;
var waypnts = [];
var numberWaypnts = 0;
var totalDistance;
var htmlOutput = ""

var route;

var autocomplete
var currentLocation = false;
var input

var place = null;

var searchTimeout = false;

var overQueryLimitCount = 0;

var timeoutID;


function initialize() {
    if (localStorage.getItem("linksHTMLString") === null) {
        localStorage.linksHTMLString = "";
        document.getElementById("onbordingOverlay").style.display = "block";
    };
    document.getElementById("distance").value = "";
    document.getElementById("locationSearch").value = "";
    input = document.getElementById('searchTextField');
    autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.addListener('place_changed', fillInAddress);

    htmlOutput = localStorage.linksHTMLString;
    output.innerHTML += htmlOutput;
    if (parseInt(localStorage.linkCrossed) >= 0) {
        for (i = 0; i <= parseInt(localStorage.linkCrossed); i++) {
            document.getElementById("cross" + parseInt(i)).style.textDecoration = "line-through";
        }
    }
}

function calcRouteCurrent() {
    if (noErrors()) {
        distanceString = document.getElementById('distance').value;
        var options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        var geoID = navigator.geolocation.watchPosition(success, error, options);
    }
    

    function success(pos) {
        document.getElementById("loading").style.display = "block"
        output.innerHTML = "";
        var crd = pos.coords;
        var currentLat, currentLng
        var timeoutID = setTimeout(function () { geowatchTimeout(geoID, false) }, 10000);
        if (crd.accuracy <= 20) {
            currentLat = crd.latitude;
            currentLng = crd.longitude;
            clearTimeout(timeoutID);
            geowatchTimeout(geoID, true);
            randomiseLoop(currentLat, currentLng);
        }
    };

    function error(err) {
        document.getElementById("loading").style.display = "none";
        if (err.code == 1) {
            displayError("Please allow location access to get your current postion. Otherwise, type your current address in the Location field.");
        } else {
            displayError("Location error " + err.code + ": " + err.message);
        }
        console.warn(`ERROR(${err.code}): ${err.message}`);
    };

}

function geowatchTimeout(geoID, successful) {
    document.getElementById("loading").style.display = "none"
    navigator.geolocation.clearWatch(geoID)
    if (!successful) {
        displayError("Could not accurately find your location. Make sure GPS on your device is turned on and is outside with a clear view of the sky. If this doesn’t work, try typing your current address in the Location field.");
    }
}

function noErrors() {
    var hasNoErrors = true;
    document.getElementById("errorMessage").style.display = "none";
    if (textValid()) {
        document.getElementsByClassName("errorText")[0].innerHTML = "";
        document.getElementById("distance").style.borderColor = "#5264AE";
    } else {
        document.getElementsByClassName("errorText")[0].innerHTML = "Number required";
        document.getElementById("distance").style.borderColor = "#D50000";
        hasNoErrors = false;
        console.log("error 1");
    }
    if (currentLocation == false) {
        if (typeof autocomplete.getPlace() == 'undefined' || typeof autocomplete.getPlace().geometry == 'undefined' || place == null) {
            document.getElementsByClassName("errorText")[1].innerHTML = "Cannot find location";
            document.getElementById("locationSearch").style.borderColor = "#D50000";
            hasNoErrors = false;
            console.log("error 2");
        } else {
            document.getElementsByClassName("errorText")[1].innerHTML = "";
            document.getElementById("locationSearch").style.borderColor = "#5264AE";
        }
    }
    if (document.getElementById("locationSearch").value == "") {
        document.getElementsByClassName("errorText")[1].innerHTML = "Location Required";
        document.getElementById("locationSearch").style.borderColor = "#D50000";
        hasNoErrors = false;
        console.log("error 3");
    } else {
        document.getElementsByClassName("errorText")[1].innerHTML = "";
        document.getElementById("locationSearch").style.borderColor = "#5264AE";
    }
    return hasNoErrors;
}

function displayError(errorText) {
    clearTimeout(timeoutID);
    document.getElementById("errorMessage").style.display = "block";
    document.getElementById("errorMessage").innerHTML = errorText;
    document.getElementById("loading").style.display = "none"
}

function textValid() {
    distanceString = document.getElementById('distance').value;
    distance = parseFloat(distanceString);
    if (isNaN(distance)) {
        return false;
    } else {
        return true;
    }
}
function calcRoute() {


    if (noErrors()) {
        distanceString = document.getElementById('distance').value;

        ///console.log(place);
        latdec = autocomplete.getPlace().geometry.location.lat();
        lngdec = autocomplete.getPlace().geometry.location.lng();

        randomiseLoop(latdec, lngdec);
    }
    console.log(noErrors());
}

function randomise(startingLat, startingLng) {

    var R = 6371;

    dist = Math.random() * ((distance * 1.1) / 2);
    brngdec = Math.random() * 360;
    start = startingLat + ", " + startingLng;


    //var R = this._radius;
    dist = dist / R;
    lat1 = startingLat * Math.PI / 180;
    lon1 = startingLng * Math.PI / 180;
    brng = brngdec * Math.PI / 180;

    //dist = typeof(dist)=='number' ? dist : typeof(dist)=='string' && dist.trim()!='' ? +dist : NaN;
    //dist = dist / this._radius; //convert dist to angular distance in radian;
    var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) + Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));
    var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) * Math.cos(lat1),
        Math.cos(dist) - Math.sin(lat1) * Math.sin(lat2));
    lon2 = (lon2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // normalise to -180..+180�

    lat2deg = lat2 * 180 / Math.PI;
    lon2deg = lon2 * 180 / Math.PI;



    waypnts[numberWaypnts] = ({
        location: lat2deg + ", " + lon2deg,
        stopover: true
    });
    //output.innerHTML = "<p><strong>" + waypnts[numberWaypnts] + "</strong></p>";

    var request = {
        origin: start,
        destination: start,
        waypoints: waypnts,
        travelMode: google.maps.DirectionsTravelMode.WALKING,
        optimizeWaypoints: true,
        avoidFerries: true
    };
    directionsService.route(request, function (response, status) {
        overQueryLimitCount = 0;
        output.innerHTML = "";
        if (status == google.maps.DirectionsStatus.OK && searchTimeout == false) {
            //directionsDisplay.setDirections(response);
            route = response.routes[0];
            totalDistance = 0;
            htmlOutput = "";
            for (var i = 0; i < (numberWaypnts + 2); i++) {
                totalDistance = totalDistance + route.legs[i].distance.value;
            }

            console.info((totalDistance * 0.001) + "km");

            if (correctTotalDistance() && hasNoFerries()) {
                clearTimeout(timeoutID);
                console.log("correct distance");

                document.getElementById("loading").style.display = "none"

                localStorage.linksHTMLString = "";

                /*localStorage.linksHTMLString += "<p style='font-size:50px'><a href='https://www.google.com.au/maps/dir/" + route.legs[numberWaypnts + 1].end_location;
                for (var i=0; i < (numberWaypnts + 2); i++){
                    localStorage.linksHTMLString += "/" + route.legs[i].end_location;
                }
                localStorage.linksHTMLString += "/data=!4m2!4m1!3e2' target='_blank'>Random Run</a></p>";*/

                // As waypoints
                localStorage.linksHTMLString = "<p class='overallLink routeLink'><a href='https://www.google.com.au/maps/dir/" + route.legs[numberWaypnts + 1].end_location;
                for (var i = 0; i < (numberWaypnts + 2); i++) {
                    localStorage.linksHTMLString += "/" + route.legs[i].end_location;
                }
                localStorage.linksHTMLString += "/data=!4m2!4m1!3e2' target='_blank'>Open full route in Google Maps</a></p>";

                localStorage.linksHTMLString += "<div class='linkDivider'></div>"

                // As different links
                for (var i = 0; i < (numberWaypnts + 2); i++) {
                    localStorage.linkCrossed = -1;
                    var tempLocationSting = "" + route.legs[i].end_location;
                    tempLocationSting = tempLocationSting.replace('(', '');
                    tempLocationSting = tempLocationSting.replace(')', '');
                    localStorage.linksHTMLString += "<p class='waypointLinks routeLink' id='cross" + i + "'><a id='myLink' href='#' onclick='crossAndGo(" + i + ", " + tempLocationSting + ");'> Section " + (i + 1) + ": Open in Google Maps</a></p>";
                }

                // As coordinates for 3rd party apps
                localStorage.linksHTMLString += "<div class='linkDivider'></div>";
                localStorage.linksHTMLString += "<div class='otherAppHeading' onclick='expandAppCoord()'>Coordinates for other navigation apps</div>";
                localStorage.linksHTMLString += "<div id='otherCoordBlock'>";
                for (var i = 0; i < (numberWaypnts + 2); i++) {
                    var tempLocationSting = "" + route.legs[i].end_location;
                    tempLocationSting = tempLocationSting.replace('(', '');
                    tempLocationSting = tempLocationSting.replace(')', '');
                    localStorage.linksHTMLString += "<div class='OtherAppCoord'>Waypoint " + (i+1) + ": " + tempLocationSting + "</div><button onclick='copyCoords("+tempLocationSting+")'>Copy waypoint" + (i+1) + "</button>";
                }
                localStorage.linksHTMLString += "</div>";

                htmlOutput = localStorage.linksHTMLString;

            }
            output.innerHTML += htmlOutput;
            if (correctTotalDistance() && hasNoFerries()) {

            } else if (totalDistance < ((distance * 1000) * 0.9) && hasNoFerries()) {
                console.log("new waypoint")
                numberWaypnts++
                randomise(startingLat, startingLng);
            } else {
                randomise(startingLat, startingLng);
            }
        }
        else if (searchTimeout == true) {
            displayError("Could not find a route, could be due to a lack of available roads/paths for the selected distance. Check the location and distance and try again.");
        }
        else {
            //window.open("https://stackoverflow.com/search?q=" + google.maps.DirectionsStatus, '_blank');
            if (status == "OVER_QUERY_LIMIT") {
                if (overQueryLimitCount > 3) {
                    displayError("Sorry my app has exceeded the number of Google Map calls it can do today. This is a limitation set by Google and cannot be avoided. Please try again tomorrow.");
                } else {
                    overQueryLimitCount++
                    setTimeout(function () { randomise(startingLat, startingLng) }, 2000);
                }
            } else if (status == "ZERO_RESULTS") {
                randomise(startingLat, startingLng);
            } else if (status == "MAX_ROUTE_LENGTH_EXCEEDED") {
                displayError("Route too long. Shorten the distance and try again.");
            } else if (status == "MAX_WAYPOINTS_EXCEEDED") {
                randomiseLoop(startingLat, startingLng);
            } else {
                displayError("Unknown error: " + status + ". Please refresh the page and try again.");
            }
            console.error(status);
        }
    });
}

function randomiseLoop(startingLat, startingLng) {
    console.log("loading...");
    document.getElementById("loading").style.display = "block"
    waypnts = [];
    totalDistance = 0;
    numberWaypnts = 0;
    searchTimeout = false;
    timeoutID = setTimeout(function () { searchTimeout = true;}, 20000);
    randomise(startingLat, startingLng);
}

function correctTotalDistance() {
    if ((totalDistance > ((distance * 1000) * 0.9)) && (totalDistance < ((distance * 1000) * 1.1))) {
        return true;
    } else {
        return false;
    }
}

function hasNoFerries() {
    var noFerries = true;
    for (var leg = 0; leg < route.legs.length; ++leg) {
        for (var step = 0; step < route.legs[leg].steps.length; ++step) {
            if (route.legs[leg].steps[step].maneuver === 'ferry') {
                noFerries = false;
                return false;
            }
        }
    }
    if (noFerries) {
        return true;
    } else {
        return false;
    }
}

function crossAndGo(linkNumber, endLocationLat, endLocationLon) {
    localStorage.linkCrossed = linkNumber;
    document.getElementById("cross" + linkNumber).style.textDecoration = "line-through";
    window.open("https://www.google.com.au/maps/dir/Current+Location/" + endLocationLat + "," + endLocationLon + "/data=!4m2!4m1!3e2", '_blank');
}

function fillInAddress() {
    place = autocomplete.getPlace();

}

function searchLocation() {
    place = null;
    document.getElementById("searchTextField").value = "";
    document.getElementById("locationSearchOverlay").style.display = "block";
    document.getElementById("searchTextField").focus();
}

function searchLocationEnd() {
    if (document.getElementById("searchTextField").value != "") {
        currentLocation = false;
        document.getElementById("searchTextField").focus();
        //document.getElementById("locationSearch").value = document.getElementById("searchTextField").value;

        document.getElementById("locationSearchOverlay").style.display = "none";

        document.getElementById("locationSearch").value = "...";

        var myLoop = setInterval(function () {
            if (place !== null) {
                document.getElementById("locationSearch").value = place.formatted_address;
                clearInterval(myLoop);
            }
        }, 2)

    }
}

function fromCurrentAddress() {
    currentLocation = true;
    document.getElementById("searchTextField").focus();
    document.getElementById("locationSearch").value = "Current Location";
    document.getElementById("locationSearchOverlay").style.display = "none";
}

function findRoute() {
    localStorage.linksHTMLString = "";
    output.innerHTML = localStorage.linksHTMLString;
    if (currentLocation) {
        calcRouteCurrent();
    } else {
        calcRoute();
    }
}

function closePanel() {
    document.getElementById("onbordingOverlay").style.display = "none";
}

function copyCoords(routeLegX, routeLegY) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = routeLegX + ", " + routeLegY;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}

function expandAppCoord() {
    var content = document.getElementById("otherCoordBlock");
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }

}


google.maps.event.addDomListener(window, 'load', initialize);


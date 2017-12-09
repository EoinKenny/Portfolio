// This is needed to save the Line ID for the end of the form when the user requests a travel time estimation.
var lineid;
// To store the user's preference of searching by Stop ID or Addresses
var pref;
// Journey Pattern ID
var jpid;
//source stop ID in third form
var srcdestoptions;


$(document).ready(function() {
	
	// Populate Line ID Dropdown menu
	dropDown();
	
	//populate destination stop/add dropdown
    $('#form-control2').on('change', (function() {
    makeDestDropDown(srcdestoptions);
    }));
		
	// Hide all items not needed on startup
	$("#selectSourceDestDiv").hide();
	$("#selectDirectionDiv").hide();
	$("#googleMapDiv").hide();
	$("#sourceDestTimeGoDiv").hide();
	$("#timetableDiv").hide();
	$("#mapSearchPreferenceDiv").hide();
	
	// Return Home Button
    $("#returnHomeButton").click(function(){
        $("#selectSourceDestDiv").hide(700);
		$("#selectDirectionDiv").hide(700);
		$("#googleMapDiv").hide(700);
		$("#sourceDestTimeGoDiv").hide(700);
		$("#loader").removeClass("loader");
		$("#mapSearchPreferenceDiv").hide();
	    $("#timetableDiv").hide(700);
		$("#selectRouteAndSearchPreference").show(700);
		clearBusTimeaAndPrediction();
    });
	
    // Timetable Button
    $("#showTimetables").click(function(){
       	$("#selectRouteAndSearchPreference").hide(700);
        $("#selectSourceDestDiv").hide(700);
		$("#selectDirectionDiv").hide(700);
		$("#googleMapDiv").hide(700);
		$("#sourceDestTimeGoDiv").hide(700);
		$("#mapSearchPreferenceDiv").hide();
		$("#timetableDiv").show(700, function(){dropDownTimetable();});
    });
	
	// Search By Map Button
    $("#selectMapSearch").click(function(){
        $("#selectSourceDestDiv").hide(700);
		$("#selectDirectionDiv").hide(700);
		$("#googleMapDiv").hide(700);
		$("#sourceDestTimeGoDiv").hide(700);
		$("#loader").removeClass("loader");
		$("#selectRouteAndSearchPreference").hide(700);
	    $("#timetableDiv").hide(700);
		// Show wanted div for search options
		$("#mapSearchPreferenceDiv").show(700);
    });
	
		$("#searchByFare").click(function(){
		$("#selectRouteAndSearchPreference").hide(700);
		$("#selectDirectionDiv").hide(700);
		$("#sourceDestTimeGoDiv").hide(700);
		$("#mapSearchPreferenceDiv").hide(700);
		searchPreference = "searchByFare"
		$("#googleMapDiv").show(700, function() {initialize();});
    });
	
	$("#searchByWalkingDistance").click(function(){
		$("#selectRouteAndSearchPreference").hide(700);
		$("#selectDirectionDiv").hide(700);
		$("#sourceDestTimeGoDiv").hide(700);
		$("#mapSearchPreferenceDiv").hide(700);
		searchPreference = "searchByWalkingDistance"
		$("#googleMapDiv").show(700, function() {initialize();});
    });
	
	$("#searchByArrivalTime").click(function(){
		$("#selectRouteAndSearchPreference").hide(700);
		$("#selectDirectionDiv").hide(700);
		$("#sourceDestTimeGoDiv").hide(700);
		$("#mapSearchPreferenceDiv").hide(700);
		searchPreference = "searchByArrivalTime"
		$("#googleMapDiv").show(700, function() {initialize();});
    });

	// Toggle the direction options after first form
    $("#firstForm").click(function() {

		//show the div and work on it
		$("#selectDirectionDiv").show(700);
		//get line id chosen by user
		lineid = $("#form-control :selected").text();
		//get choice between stopid or address chosen by user
		pref = $('input[name=inlineRadioOptions]:checked').val();
		getFirstandLastAddress();
		//hide other divs
		$("#selectRouteAndSearchPreference").hide(700);
    });

	// Toggle the Map Option after first form
    $("#selectMapSearch").click(function(){
		
		$("#searchByFare").show(700);
		$("#searchByWalkingDistance").show(700);
		$("#searchByArrivalTime").show(700);
    });

	// Toggle the Address/Stop ID drop down menu Options after picking direction 0
    $("#direction0").click(function() {

		$("#selectDirectionDiv").hide(700);
        $("#sourceDestTimeGoDiv").slideToggle(700, function() {$( "#datepicker" ).datetimepicker();});
        getSourceDestination($(this).val(),0,pref);
        //set jpid here
        jpid = $(this).val() + "";

    });

	// Toggle the Address/Stop ID drop down menu Options after picking direction 1
    $("#direction1").click(function(){

		$("#selectDirectionDiv").hide(700);
        $("#sourceDestTimeGoDiv").slideToggle(700, function() {$( "#datepicker" ).datetimepicker();});
        getSourceDestination($(this).val(),1,pref);
        //set jpid here
        jpid = $(this).val() + "";

    });
	
	// 'GET' request for Time Estimation
	$('#selectSourceDestFrom').ajaxForm(function() {
		// Reset
		$("#loader").removeClass("loader");
		document.getElementById("travelTimeDiv").innerHTML = "";
		document.getElementById("travelPriceDiv").innerHTML = "";
		$("#loader").addClass("loader");
		
		var source;
		var destination;
		
		if (pref == "address") {
			source = $('#form-control2 :selected').val();
			destination = $('#form-control3 :selected').val();
		}
		else {
			source = $('#form-control2 :selected').text();
			destination = $('#form-control3 :selected').text();
		}

		var dateTime = $('#datepicker').datepicker('getDate');
		getTravelTime(source, destination, dateTime);

	});

	// 'GET' request for source and destination addresses after first form
	$('#stopIdOrAddress').ajaxForm(function() {
		// This is just to disable the form's usual function
	});
	
// 'GET' request for source and destination addresses after first form
	$('#PickRouteTimetable').ajaxForm(function() {
		
		// Transfrom data into array of objects
        var data = $("#PickRouteTimetable :input").serializeArray();
		
		var addresses;

			$.ajax({
			  dataType: "json",
			  url: $SCRIPT_ROOT + "/_getStartEndAddresses/" + data[0].value,
			  async: false, 
			  success: function(info) {
				addresses = info;
				}
			});
				
		var dir0Source = addresses[0].Short_Address_Source;
		var dir0Dest = addresses[0].Short_Address_Destination;
		
		// In case there is only one direction in the route
		if (addresses.length == 2) {
		var dir1Source = addresses[1].Short_Address_Source;
		var dir1Dest = addresses[1].Short_Address_Destination;
			
		}
		
         var jqxhr = $.getJSON($SCRIPT_ROOT + "/_getSelectedTimetable/" + data[0].value, function(timetables) {

 
			var direction0 = [];
			var direction1 = [];
			 
			 _.forEach(timetables, function(stop) {
				 if(stop.Journey_Pattern_ID.charAt(4) =='0') direction0.push(stop);
				 if(stop.Journey_Pattern_ID.charAt(4) =='1') direction1.push(stop);
				 if(stop.Journey_Pattern_ID.charAt(4) =='X') direction0.push(stop);
				 if(stop.Journey_Pattern_ID.charAt(0) =='P') direction0.push(stop);
				 
			 })

			var option1 = "<table class='t01'><tr><th>Monday to Friday</th></tr><tr>";

			var count = 0;
			 // Sort the times into nice tables
			 _.forEach(direction0, function(stop) {

				if (stop.Day_Cat == "Mon-Fri"){

					if (count <= 3) {
						count += 1;
						option1 += "<td>" + stop.Time_no_date + "</td>";
					} 
					else {
						count = 0;
						option1 += "</tr><tr>";
					}
				}

			})
			 count = 0;
			 option1 = option1.slice(0, -5) + "</table>";

			var option2 = "<table class='t01'><tr><th>Saturday</th></tr><tr>";

				 var count = 0;

			 _.forEach(direction0, function(stop) {

				if (stop.Day_Cat == "Sat"){

					if (count <= 3) {
						count += 1;
						option2 += "<td>" + stop.Time_no_date + "</td>";
					} 
					else {
						count = 0;
						option2 += "</tr><tr>";
					}
				}

			})
			 count = 0;
			 option2 = option2.slice(0, -5) + "</table>";

		   var option3 = "<table class='t01'><tr><th>Sunday</th></tr><tr>";

				 var count = 0;

			 _.forEach(direction0, function(stop) {

				if (stop.Day_Cat == "Sun"){

					if (count <= 3) {
						count += 1;
						option3 += "<td>" + stop.Time_no_date + "</td>";
					} 
					else {
						count = 0;
						option3 += "</tr><tr>";
					}
				}

			})
			 
			 
				 
			 count = 0;
			 option3 = option3.slice(0, -5) + "</table>";
			 
			 var option4 = "<table class='t01'><tr><th>Monday to Friday</th></tr><tr>";

			var count = 0;

			 _.forEach(direction1, function(stop) {

				if (stop.Day_Cat == "Mon-Fri"){

					if (count <= 3) {
						count += 1;
						option4 += "<td>" + stop.Time_no_date + "</td>";
					} 
					else {
						count = 0;
						option4 += "</tr><tr>";
					}
				}

			})
			 count = 0;
			 option4 = option4.slice(0, -5) + "</table>";

			var option5 = "<table class='t01'><tr><th>Saturday</th></tr><tr>";

			var count = 0;

			 _.forEach(direction1, function(stop) {

				if (stop.Day_Cat == "Sat"){

					if (count <= 3) {
						count += 1;
						option5 += "<td>" + stop.Time_no_date + "</td>";
					} 
					else {
						count = 0;
						option5 += "</tr><tr>";
					}
				}

			})
			 count = 0;
			 option5 = option5.slice(0, -5) + "</table>";

		   var option6 = "<table class='t01'><tr><th>Sunday</th></tr><tr>";

				 var count = 0;

			 _.forEach(direction1, function(stop) {

				if (stop.Day_Cat == "Sun"){

					if (count <= 3) {
						count += 1;
						option6 += "<td>" + stop.Time_no_date + "</td>";
					} 
					else {
						count = 0;
						option6 += "</tr><tr>";
					}
				}

			})
			 
			 option6 = option6.slice(0, -5) + "</table>";
			 
			 // If it's not a single direction route
			 if (dir1Source == undefined) {
				 
				$("#direction1TimeTable").html("")
				$("#selectedTimetable1Div2").html("");
				$("#selectedTimetable2Div2").html("");
				$("#selectedTimetable3Div2").html("");

				//set html content of form
				$("#direction0TimeTable").html("");
				$("#selectedTimetable1Div").html("");
				$("#selectedTimetable2Div").html("");
				$("#selectedTimetable3Div").html("");

				//set html content of form
				$("#direction0TimeTable").html("<h1>" + dir0Source + " to " + dir0Dest + "</h1>");
				$("#selectedTimetable1Div").html(option1);
				$("#selectedTimetable2Div").html(option2);
				$("#selectedTimetable3Div").html(option3);

				 
				 
			 } else {
				 
				 
				$("#direction1TimeTable").html("")
				$("#selectedTimetable1Div2").html("");
				$("#selectedTimetable2Div2").html("");
				$("#selectedTimetable3Div2").html("");

				//set html content of form
				$("#direction0TimeTable").html("");
				$("#selectedTimetable1Div").html("");
				$("#selectedTimetable2Div").html("");
				$("#selectedTimetable3Div").html("");
				 
				$("#direction1TimeTable").html("<h1>" + dir1Source + " to " + dir1Dest + "</h1>")
				$("#selectedTimetable1Div2").html(option4);
				$("#selectedTimetable2Div2").html(option5);
				$("#selectedTimetable3Div2").html(option6);

				//set html content of form
				$("#direction0TimeTable").html("<h1>" + dir0Source + " to " + dir0Dest + "</h1>");
				$("#selectedTimetable1Div").html(option1);
				$("#selectedTimetable2Div").html(option2);
				$("#selectedTimetable3Div").html(option3);
				 
				 
			 }
			
		});
	
	});

});
//------------------------------------------------------------------------------------------------------------- //
// POPULATE MENUS ON APPLICATION


// Function to populate the line id dropdown menu on front page
function dropDown() {

	var jqxhr = $.getJSON($SCRIPT_ROOT + "/_getRoutes", function(data) {

		lineids = data.lineids;
		var options = "";

		_.forEach(lineids, function(data) {

			options += "<option>"+ data.Line_ID +"</option>";
		})
		$("#form-control").html(options);
	})
}


// Function to populate the line id dropdown menu on the timetable page
function dropDownTimetable() {

// 'GET' request for timetable routes
    var jqxhr = $.getJSON($SCRIPT_ROOT + "/_getRoutes", function(data) {
    lineids = data.lineids;
    var options = "";

    _.forEach(lineids, function(lineid) {

        options += "<option>"+ lineid.Line_ID +"</option>";

    })
    $("#form-controltimetable").html(options);
	})
	;
}


// Populate the start and destination in second page with some addresses, i.e. from A to B and from B to A
function getFirstandLastAddress() {

	var jqxhr = $.getJSON($SCRIPT_ROOT + "/_getStartEndAddresses/" + lineid, function(data) {

		var direction0 = $('#direction0');
		var direction1 = $('#direction1');
				
		//in case there is only one direction 
		if (data.length == 1) {
			
			//hide div direction1
			direction1.hide();
			
			direction0.html("<span class='glyphicon glyphicon-circle-arrow-right'></span>" + ' From ' + data[0].Short_Address_Source + ' To ' + data[0].Short_Address_Destination);
			direction0.val(data[0].Journey_Pattern_ID + "");	
		}
		
		else {
			
			//show div direction1
			direction1.show();
			
			//populating directions
			direction0.html("<span class='glyphicon glyphicon-circle-arrow-right'></span>" + ' From ' + data[0].Short_Address_Source + ' To ' + data[0].Short_Address_Destination);
			direction1.html("<span class='glyphicon glyphicon-circle-arrow-left'></span>" + ' From ' + data[1].Short_Address_Source + ' To ' + data[1].Short_Address_Destination);
			
			//setting direction's value for later query in function getSourceDestination
			direction0.val(data[0].Journey_Pattern_ID + "");
			direction1.val(data[1].Journey_Pattern_ID + "");
			
		}

	})
}


// Get stops or addresses on a chosen line based on pref 
function getSourceDestination(jpid,direction,pref) {

	var jqxhr2 = $.getJSON($SCRIPT_ROOT + "/_preference/" + pref + "/" + jpid, function(data) {

		var options = "";

		_.forEach(data, function(stop) {

			options += '<option value = "' + stop.Stop_ID + '">' +  stop.Stop_info + "</option>";
		})
        
		//set options to global variable srcdestoptions
        srcdestoptions = options;
		//set html content of form
		$("#form-control2").html(options);
		
		//populate dest dropdown menu when page is first loaded
		makeDestDropDown(options);
		
	});
}


// populates the destination drop down menu depending upon the source stop chosen
function makeDestDropDown(options){
		
    var src = document.getElementById('form-control2').value;
    var regex=".*?("+ src + ")";
    var re = new RegExp(regex, "g");
    var newoptions = options.replace(re, "");
    
    newoptions = '<option value =' + newoptions;
    
    //remove first blank option
    newoptions = newoptions.replace(/^(.*?)<\/option>/, "");
    
    $("#form-control3").html(newoptions);

}


// --------------------------------------------------------------------------------------------------------------- //
// FOR DISPLAYING THE MODEL'S PREDICTIONS

// Display in a small box when the bus will arrive (timetable) and how long it will take to arrive to destination from source
function getTravelTime(source, destination, dateTime) {

	$.ajax({
	  dataType: "json",
	  url: $SCRIPT_ROOT + "/_getTravelTime/" + jpid + "/" + source + "/" + destination + "/" + dateTime,
	  async: true, 
	  success: function(info) {

		  //seconds it takes for bus to travel from terminus to source chosen by user
			var timeFromTerminusToSource = info[1];

			//seconds it takes for bus to travel from source to destination chosen by user
			var timeFromSourceToDest = info[0] - info[1];

			if (isNumeric(info[0]) && isNumeric(info[1])) {

				//make jpid in the following form "0013000%" so that we can use the LIKE operator in mysql
				var jpidTruncated = String(jpid);
				
                //check if route is subroute
                var route = jpidTruncated[jpidTruncated.length -1];
				
				jpidTruncated = (jpidTruncated.slice(0,-1)) + "%";
				//we dont need 25 in %25 but apache decodes %25 as % and % gives a 400 error so we have to go for this solution
				jpidTruncated = (jpidTruncated.slice(0,-1)) + "%25";

				//get label "Mon-Fri" or "Sat" or "Sun" from datetime
				var timeCat = convertDateTimetoTimeCat(dateTime);

				//display travel time
				getTravelTimeWithTimetable(jpidTruncated, source, destination, dateTime.getHours(), dateTime.getMinutes(),
						dateTime.getSeconds(), timeFromTerminusToSource, timeCat, timeFromSourceToDest);

				getPricing(jpid, source, destination, jpid.charAt(4));

			} else {
				$("#loader").removeClass("loader");
				document.getElementById("travelTimeDiv").innerHTML = "";
				document.getElementById("travelPriceDiv").innerHTML = "";
				$("#travelTimeDiv").html("Bus does not run on this day or none left.")
			}
	  }
	});
}


// Give the time it will take for the bus to arrive at the user's location
function getTravelTimeWithTimetable(jpidTruncated, srcStop, destStop, hour, minute, sec, sourceTime, timeCat, timeFromSourceToDest, subroute) {
	
	$.ajax({
	  dataType: "json",
	  url: $SCRIPT_ROOT + "/get_bus_time/"  + jpidTruncated + "/" + srcStop + "/" + destStop + "/" + hour + "/" + minute + "/"
			+ sec + "/" + sourceTime + "/" + timeCat,
	  async: true, 
	  success: function(data) {
		  
		  // In case the bus doesn't run anymore today or not this day at all
		  try {
		  
		  var route_or_sub = data[0].Journey_Pattern_ID;
		  
		  // Account for the possibility of tis being a sub route
		  var subroute = false;
                if (route_or_sub.charAt(route_or_sub.length -1) != '1'){
                    subroute = true;
                }
		  		
		var currentTime = new Date().toLocaleTimeString('en-GB', { hour: "numeric", minute: "numeric"});
		var timeBusArrives = data[0].Time_bus_arrives;

		var timeToArriveInMins = getTimeToArrive(timeBusArrives, currentTime);
		var timeFromSourceToDestInMins = parseInt(timeFromSourceToDest/60);
        var subrouteText = "";  
		  
		// If it's a sub route then add in this text to tell the user
        if (subroute) subrouteText = "<b> This bus is a subroute</b>";

		$("#travelTimeDiv").html("The <b>" + lineid +  "</b>  will arrive at <b>" + timeBusArrives + "</b>.<BR>" +
				"<BR>Your Travel time will be <b>" + timeFromSourceToDestInMins + "Mins</b> <BR><BR>" + subrouteText).promise().done(function(){
			$("#loader").removeClass("loader");
		});
		  
		  
				} catch(TypeError) {
			  $("#loader").removeClass("loader");
				document.getElementById("travelTimeDiv").innerHTML = "";
				document.getElementById("travelPriceDiv").innerHTML = "";
				$("#travelTimeDiv").html("Bus does not run on this day or none left.")
		  }
	}
	});
}


//ajax call to backend to get fare prices from Dublin Bus Fare calculator
function getPricing(jpid, stop1, stop2, direction) {

	info = ["Adult Cash", "Adult Leap", "Child Cash (Under 16)", "Child Leap (Under 19)", "School Hours Cash", "School Hours Leap"]
		
	$.ajax({
	  dataType: "json",
	  url: $SCRIPT_ROOT + "/getPricing/" + jpid + "/" + stop1 + "/" + stop2 + "/" + direction,
	  async: true, 
	  success: function(data) {

		options = "<b>Fare Prices</b>: <BR>";

		_.each(data, function(value, key) {
			
			options += key + ": €" + value.replace("Euros", "") + "<BR>";
		});

		$("#travelPriceDiv").html(options + "*No change given on cash fares");
	}
		
	});
}


//slice date time string to get time
function getTimeToArrive(arrival, current) {

	arrival = arrival.slice(0,5);
	var arrivalHour = parseInt(arrival.slice(0,2));
	var arrivalMin = parseInt(arrival.slice(3, 5));
	var currentHour = parseInt(current.slice(0,2));
	var currentMin = parseInt(current.slice(3,5));

	var hour = arrivalHour - currentHour;
	var min = arrivalMin - currentMin;

	return (hour + min).toString();

}

//clear bus time and prediction
function clearBusTimeaAndPrediction() {

	$("#travelTimeDiv").html("");
	$("#travelPriceDiv").html("");
	$("#loader").removeClass("loader");
}


// Convert the JavaScript day into our model's options
function convertDateTimetoTimeCat(dateTime) {

	var day = dateTime.getDay();

	if (day == 0)
		return "Sun";
	else if (day >= 1 && day <= 5)
		return "Mon-Fri";
	else
		return "Sat";
}


//function that return true if n is a number (float or integer), false otherwise
function isNumeric(val) {
	
    return Number(parseFloat(val)) == val;
    
}
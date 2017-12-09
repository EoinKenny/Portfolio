// Necessary for American OnHover functionality on map
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-941940-28']);
_gaq.push(['_trackPageview']);

(function() {
 var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
 ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
 var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// ================================================================================== //

// Globals 
var display_year = 1900;
var bubbles;  // For the bubbles in the main chart
var names;  // The names of countries for bubbles plot
var interval;  // For animation interval
var centerYear;  // For Year in center of Svg1
var bars1;  // Bars for chart 1
var bars2;  // Bars for chart 2
var barChart1Height;  // The highest value for the height of bar chart 1
var barChart2Height;  // The highest value for the height of bar chart 2
var traceBubbles;  // For the trace which can be drawn
var traceNames;  // The trace names for a country
var traceBubblesGroups;  // The groups for the trace data
var currentFilter;  // For keeping track of which filter is currently used by the map

// Scale Globals
var xScale;  // Main chart
var yScale;
var yScaleBar1;  // First bar chart
var xScaleBar1;
var yScaleBar2;  // Second bar chart
var xScaleBar2;
var popScale;  // Scale the bubbles & Text
var playPause = false;  // For the play/pause button on the main page


function make_x_gridlines() {		
    return d3.axisBottom(xScale)
        .ticks(3)
}


function make_y_gridlines() {		
    return d3.axisLeft(yScale)
        .ticks(7)
}


function getHeightOfBarCharts(data) {
	var max = 0;
	for (var i = 0; i < data.length; i++) {
		for (var j = 0; j < data[i].values.length; j++) {
			if (data[i].values[j].value > max) {
				max = data[i].values[j].value;
			}
		}
	}
	return max;
}


// =============================== Main Canvas ===================================== //
// Define margins
var margin = {top: 20, right: 20, bottom: 50, left: 50};

var outer_width = 800;
var outer_height = 500;
var svg1_width = outer_width - margin.left - margin.right;
var svg1_height = outer_height - margin.top - margin.bottom;

//Create SVG element as a group with the margins transform applied to it
var svg1 = d3.select("#svg1")
			.attr("width", svg1_width + margin.left + margin.right)
			.attr("height", svg1_height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("class", "chart");


// =========================== First Barchart ===================================== //
// Define margins
margin = {top: 50, right: 50, bottom: 50, left: 175};

outer_width = 400;
outer_height = 245;
var svg2_width = outer_width - margin.left - margin.right;
var svg2_height = outer_height - margin.top - margin.bottom;

//Create SVG element as a group with the margins transform applied to it
var svg2 = d3.select("#svg2")
			.attr("width", svg2_width + margin.left + margin.right)
			.attr("height", svg2_height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("class", "chart");


// ========================== Second Barchart ===================================== //
// Define margins
margin = {top: 50, right: 50, bottom: 50, left: 175};

outer_width = 400;
outer_height = 245;
var svg3_width = outer_width - margin.left - margin.right;
var svg3_height = outer_height - margin.top - margin.bottom;

//Create SVG element as a group with the margins transform applied to it
var svg3 = d3.select("#svg3")
			.attr("width", svg3_width + margin.left + margin.right)
			.attr("height", svg3_height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("class", "chart");


function startAnimation() {

	// Load the file data.csv and generate a visualisation based on it
	d3.csv("Gapminder_All_Time.csv", function(error, data){

		// Clear timeout so that they don't double up and double the speed
		clearTimeout(interval);

		// handle any data loading errors
		if(error){
			console.log("Something went wrong");
			console.log(error);
			
		} else {
			// convert variables to numeric type
			data.forEach(function(d){ d['Population'] = +d['Population']; });
			data.forEach(function(d){ d['LifeExp'] = +d['LifeExp']; });
			data.forEach(function(d){ d['GDP'] = +d['GDP']; });    

				if (playPause == false) {
					playPause = true;

					// Generate the visualisation in intervals
					interval = setInterval(function() {

						if (display_year < 1950) {
							display_year = parseInt(display_year) + 10; 
							generateVis(data);
							drawYear();

						} else if (display_year >= 1950 && display_year < 2016) {
							display_year = parseInt(display_year) + 1;
							generateVis(data);
							drawYear();

						} else {
							clearTimeout(interval);
						}
					}, 500);
				} else {
					clearTimeout(interval);
					playPause = false;
				}
		}
	});
}


function drawInitialChart() {

    d3.csv("Gapminder_All_Time.csv", function(error, data){

	// handle any data loading errors
	if(error){
		console.log("Something went wrong");
		console.log(error);
		
	} else {
		// convert variables to numeric type
		data.forEach(function(d){ d['Population'] = +d['Population']; });
		data.forEach(function(d){ d['LifeExp'] = +d['LifeExp']; });
		data.forEach(function(d){ d['GDP'] = +d['GDP']; });    

		// Create a scale to scale GDP x-axis *******************************************
		xScale = d3.scaleLog()
			.domain([100, d3.max(data, function(d) { return +d.GDP;}) ])
			.range([0, svg1_width]);

		// Create a scale object to scale Life Expectency y-axis
		yScale = d3.scaleLinear()
			.domain([10, d3.max(data, function(d) { return +d.LifeExp; }) ])
			.range([svg1_height, 0]);

		// Create an x-axis connected to the x scale ***********************************
		var xAxis = d3.axisBottom()
			.scale(xScale)
			.ticks(3)
			.tickFormat(function(d) { return "$" + String(d); });

		// Create a y-axis connected to the y scale
		var yAxis = d3.axisLeft()
			.scale(yScale);

		// ========================== Bar One (Region) ============================= //

		// Nest data for getting the largest number of countries for height of bar chart later
		var numCountriesRegionData = d3.nest()
			.key(function(d) { return d.Year; })
			.key(function(d) { return d.Region; })
			.rollup(function(d) { return d.length; })
			.entries(data);

		// Get List of all possible Regions 
		var regionData = d3.nest()
			.key(function(d) { return d.Region; })
			.entries(data);

		// Get height of first bar chart
		barChart1Height = getHeightOfBarCharts(numCountriesRegionData);

		yScaleBar1 = d3.scaleBand()
			.domain(regionData.map(function(d){ return d.key; }))
			.range([svg2_height,0])
			.paddingInner(0.05)
			.paddingOuter(0.05);

		xScaleBar1 = d3.scaleLinear()
			.domain([0, barChart1Height])
			.range([0, svg2_width]);

		var xAxisBar1 = d3.axisBottom()
			.scale(xScaleBar1)
			.ticks(4);

		var yAxisBar1 = d3.axisLeft()
			.scale(yScaleBar1);

		// ================ Bar Two (Government) ================= //

		// Nest data for getting the largest number of countries for height of bar chart later
		var numCountriesGovData = d3.nest()
			.key(function(d) { return d.Year; })
			.key(function(d) { return d.Government; })
			.rollup(function(d) { return d.length; })
			.entries(data);

		// Get List of all possible Governments 
		var govData = d3.nest()
			.key(function(d) { return d.Government; })
			.entries(data);

		// Get height of first bar chart
		barChart2Height = getHeightOfBarCharts(numCountriesGovData);

		yScaleBar2 = d3.scaleBand()
			.domain(govData.map(function(d){ return d.key; }))
			.range([svg3_height,0])
			.paddingInner(0.05)
			.paddingOuter(0.05);

		xScaleBar2 = d3.scaleSqrt()
			.domain([0, barChart2Height])
			.range([0, svg3_width]);

		var xAxisBar2 = d3.axisBottom()
			.scale(xScaleBar2)
			.ticks(3);

		var yAxisBar2 = d3.axisLeft()
			.scale(yScaleBar2);

		// ===================== Create Population Scale (for circles) ===================== //

		// Nest data for getting the largest number of countries for height of bar chart later
		popScale = d3.scaleLinear()
			.domain([0, d3.max(data, function(d) { return +d.Population;}) ])
			.range([80, 4000]);

		// ==================== Call the Main axis =========================== //

		// Call the x-axis
		svg1.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + svg1_height + ")")
			.call(xAxis);
			
		// Call the y axis
		svg1.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0, 0)")
			.call(yAxis);

		// Add x label
		svg1.append("text")
			.attr("x", svg1_width/2)
			.attr("y", svg1_height + 30)
			.text("Income")
			.attr("text-anchor", "middle")
			.attr("fill", "grey");

		// Add y label
		svg1.append("text")
			.attr("x", 0)
			.attr("y", (svg1_height/2) - 30)
			.text("Life Expectency")
			.attr("transform", "rotate(270, 0," + svg1_height/2 + ")")
			.attr("text-anchor", "middle")
			.attr("fill", "grey");	


		// ==================== Call the Bar1 axis =========================== //

		// Call the x-axis
		svg2.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + svg2_height + ")")
			.call(xAxisBar1);
			
		// Call the y axis
		svg2.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0, 0)")
			.call(yAxisBar1);

		// Add x label
		svg2.append("text")
			.attr("x", svg2_width/2)
			.attr("y", svg2_height + 30)
			.text("Number of Countries")
			.attr("text-anchor", "middle")
			.attr("fill", "grey");

		// Add y label
		svg2.append("text")
			.attr("x", svg2_width/2)
			.attr("y", -5)
			.text("Regions")
			.attr("text-anchor", "middle")
			.attr("fill", "grey");		

		// ==================== Call the Bar2 axis =========================== //

		// Call the x-axis
		svg3.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + svg3_height + ")")
			.call(xAxisBar2);
			
		// Call the y axis
		svg3.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0, 0)")
			.call(yAxisBar2);

		// Add x label
		svg3.append("text")
			.attr("x", svg3_width/2)
			.attr("y", svg3_height + 30)
			.text("Number of Countries")
			.attr("text-anchor", "middle")
			.attr("fill", "grey");

		// Add y label
		svg3.append("text")
			.attr("x", svg3_width/2)
			.attr("y", -5)
			.text("Governments")
			.attr("text-anchor", "middle")
			.attr("fill", "grey");	


		// add the X gridlines
		svg1.append("g")			
		  .attr("class", "grid")
		  .attr("transform", "translate(0," + svg1_height + ")")
		  .call(make_x_gridlines()
		      .tickSize(-svg1_height)
		      .tickFormat("")
		  )

		// add the Y gridlines
		svg1.append("g")			
		  .attr("class", "grid")
		  .call(make_y_gridlines()
		      .tickSize(-svg1_width)
		      .tickFormat("")
	      )

// ============================================================================================= //
// ===================================== Draw The Map ========================================== //
// ============================================================================================= //

		// Decide on project method (using Mercator)
		var projection = d3.geoHill()
		    .center([0,0])
		    .rotate([0, 0])
		    .scale(35)
		    .translate([svg1_width - 133, svg1_height - 42]);

		var path = d3.geoPath()
			.projection(projection);

		// Map Gridlines
		var graticule = d3.geoGraticule();

		var outterg = svg1.append("g");

		outterg.append("g")
			.attr("id", "innerg")
			.append("path")
		    .datum(graticule)
		    .attr("id", "graticule")
		    .attr("d", path);

		// Read in json data in raw format
		d3.json("continent-geogame-110m.json", function(error, world) {

		  // Convert the raw json file into topojson file
		  var countries = topojson.feature(world, world.objects.countries);

		  // Make the objects
		  var asia = {type: "FeatureCollection", name: "Asia", color: "#d7191c", id:1, features: countries.features.filter(function(d) { 
		  	return d.properties.continent=="Asia" || d.properties.continent=="Oceania"; })};
		  var africa = {type: "FeatureCollection", name: "Africa", color: "#abd9e9", id:2, features: countries.features.filter(function(d) { 
		  	return d.properties.continent=="Africa"; })};
		  var europe = {type: "FeatureCollection", name: "Europe", color: "#fdae61", id:3, features: countries.features.filter(function(d) { 
		  	return d.properties.continent=="Europe"; })};
		  var america = {type: "FeatureCollection", name: "America", color: "#2c7bb6", id:4, features: countries.features.filter(function(d) { 
		  	return d.properties.continent=="North America" || d.properties.continent=="South America";; })};

		  // Make the array of data objects to work with in D3
		  var continents = [asia,africa,europe,america];

		  // Bind Data
		  var continent = svg1.selectAll(".continent").data(continents);

		  // Append the polygon continent shapes and add general functionality
		  continent.enter().insert("path")
		      .attr("class", "continent")
		      .attr("d", path)
		      .attr("id", function(d,i) { return d.id; })
		      .attr("title", function(d,i) { return d.name; })
		      .style("fill", function(d,i) { return d.color; })
		      .on("mouseout",  function(d,i) {
		        d3.select(this).attr("opacity", 1);
		      })
		      .on("mouseover", function(){
		        d3.select(this).attr("opacity", 0.5);
		      })
		      .on("click", function(d){

		      	if (d.name == "America") {

		      		if (currentFilter == "America") {

		      			currentFilter = undefined;

		      			d3.selectAll(".america").attr("opacity", 1);
			      		d3.selectAll(".europe").attr("opacity", 1);
			      		d3.selectAll(".asia").attr("opacity", 1);
			      		d3.selectAll(".africa").attr("opacity", 1);

		      		} else {

			      		d3.selectAll(".america").attr("opacity", 1);
			      		d3.selectAll(".europe").attr("opacity", 0.2);
			      		d3.selectAll(".asia").attr("opacity", 0.2);
			      		d3.selectAll(".africa").attr("opacity", 0.2);

			      		currentFilter = "America";

		      		}

		      	} else if (d.name == "Asia") {

		      		if (currentFilter == "Asia") {

		      			currentFilter = undefined;

		      			d3.selectAll(".america").attr("opacity", 1);
			      		d3.selectAll(".europe").attr("opacity", 1);
			      		d3.selectAll(".asia").attr("opacity", 1);
			      		d3.selectAll(".africa").attr("opacity", 1);

		      		} else {

			      		d3.selectAll(".america").attr("opacity", 0.2);
			      		d3.selectAll(".europe").attr("opacity", 0.2);
			      		d3.selectAll(".asia").attr("opacity", 1);
			      		d3.selectAll(".africa").attr("opacity", 0.2);

			      		currentFilter = "Asia";

		      		}
		      		
		      	} else if (d.name == "Europe") {

		      		if (currentFilter == "Europe") {

		      			currentFilter = undefined;

		      			d3.selectAll(".america").attr("opacity", 1);
			      		d3.selectAll(".europe").attr("opacity", 1);
			      		d3.selectAll(".asia").attr("opacity", 1);
			      		d3.selectAll(".africa").attr("opacity", 1);

		      		} else {

			      		d3.selectAll(".america").attr("opacity", 0.2);
			      		d3.selectAll(".europe").attr("opacity", 1);
			      		d3.selectAll(".asia").attr("opacity", 0.2);
			      		d3.selectAll(".africa").attr("opacity", 0.2);

			      		currentFilter = "Europe";

		      		}
		      	
		      	} else {

		      		if (currentFilter == "Africa") {

		      			currentFilter = undefined;

		      			d3.selectAll(".america").attr("opacity", 1);
			      		d3.selectAll(".europe").attr("opacity", 1);
			      		d3.selectAll(".asia").attr("opacity", 1);
			      		d3.selectAll(".africa").attr("opacity", 1);

		      		} else {

			      		d3.selectAll(".america").attr("opacity", 0.2);
			      		d3.selectAll(".europe").attr("opacity", 0.2);
			      		d3.selectAll(".asia").attr("opacity", 0.2);
			      		d3.selectAll(".africa").attr("opacity", 1);

			      		currentFilter = "Africa";
		      		}
		      	}
		      });
			});
  		} 
	});
}

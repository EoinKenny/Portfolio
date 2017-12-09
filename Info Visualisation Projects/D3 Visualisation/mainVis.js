// On load up
$( document ).ready(function() {

	// Fill drop down menus and draw axis/year
    fillDropDown1();
    fillDropDown2();
    drawInitialChart();
    drawYear();

    // Draw initial plot at 1990
    d3.csv("Gapminder_All_Time.csv", function(error, data){
		
		if(error){
			console.log("Something went wrong");
			console.log(error);
			
		} else {
			data.forEach(function(d){ d['Population'] = +d['Population']; });
			data.forEach(function(d){ d['LifeExp'] = +d['LifeExp']; });
			data.forEach(function(d){ d['GDP'] = +d['GDP']; });    

			generateVis(data);
		}
	});

    $( "#dropDown1" ).change(function() {

    	playPause = false;

		display_year = $("select#dropDown1 option").filter(":selected").text();
		clearTimeout(interval);
		
	    // Draw initial plot at 1990
	    d3.csv("Gapminder_All_Time.csv", function(error, data){
			
			if(error){
				console.log("Something went wrong");
				console.log(error);
				
			} else {
				data.forEach(function(d){ d['Population'] = +d['Population']; });
				data.forEach(function(d){ d['LifeExp'] = +d['LifeExp']; });
				data.forEach(function(d){ d['GDP'] = +d['GDP']; });    

				drawYear();
				generateVis(data);
			}
		});

	});

    $( "#dropDown2" ).change(function() {

    	playPause = false;
		var country  = $("select#dropDown2 option").filter(":selected").text();
		clearTimeout(interval);
		
	    // Draw initial plot at 1990
	    d3.csv("Gapminder_All_Time.csv", function(error, data){
			
			if(error){
				console.log("Something went wrong");
				console.log(error);
				
			} else {
				// convert variables to numeric type
				data.forEach(function(d){ d['Population'] = +d['Population']; });
				data.forEach(function(d){ d['LifeExp'] = +d['LifeExp']; });
				data.forEach(function(d){ d['GDP'] = +d['GDP']; });    

				drawYear();
				drawTrace(country);
				drawTrace(country);
			}
		});
	});
});


function fillDropDown1() {
	var menu = document.getElementById("dropDown1");
	var items = "";
	for (var i = 1900; i <= 1950; i+=10) items += "<option>" + String(i) + "</option>";
	for (var i = 1951; i < 2017; i++) items += "<option>" + String(i) + "</option>";
	menu.innerHTML = items;
}


function fillDropDown2() {
	d3.csv("Gapminder_All_Time.csv", function(error, data){
			if(error){
				console.log("Something went wrong");
				console.log(error);
			} else {
				var menu = document.getElementById("dropDown2");
				var items = "";
				var menuItems = d3.nest()
					.key(function(d) { return d.Country; })
					.entries(data);
				for (var i = 0; i < menuItems.length; i++) items += "<option>" + menuItems[i].key + "</option>";
				menu.innerHTML = items;
			}
	});
}


// define a function that filters data by year
function yearFilter(value){
	return (value.Year == display_year)
}


// Get all data for a country's trace
function getTraceData(country, data) {
	for (var i = 0; i < data.length; i++) {
		if (data[i].key == country) return data[i].values;
	}
}


// Define a fucntion to draw a simple bar chart
function generateVis(dataset){ 

	try {
		// Always clear the trace if it's there
		traceBubblesGroups.remove();

	} catch (TypeError) {
		// Do nothing

	} finally {

		// If no current filter applied to countries with map, make sure opacity = 1
		if (currentFilter == undefined) {
			d3.selectAll(".europe").attr("opacity", 0.9);
			d3.selectAll(".asia").attr("opacity", 0.9);
			d3.selectAll(".america").attr("opacity", 0.9);
			d3.selectAll(".africa").attr("opacity", 0.9);
		}

		// Filter the data to only include the current year
		var filtered_datset = dataset.filter(yearFilter);

		// ========================== Bar One (Region) ============================= //
		var numCountriesRegionData = d3.nest()
			.key(function(d) { return d.Region; })
			.rollup(function(a) { return a.length; })
			.entries(filtered_datset);

		// ======================== Bar Two (Government) =========================== //
		var numCountriesGovData = d3.nest()
			.key(function(d) { return d.Government; })
			.rollup(function(a) { return a.length; })
			.entries(filtered_datset);

		// ****************************** DATA JOIN ******************************** //
		mainGroups = svg1.selectAll(".MainGroups")
			.data(filtered_datset, function key(d) { return d.Country; });

		bubbles = svg1.selectAll("circle")
		    .data(filtered_datset, function key(d) { return d.Country; });

		names = svg1.selectAll(".Names")  // The names of countries with population above 60000000
		    .data(filtered_datset, function key(d) { return d.Country; });

		bars1 = svg2.selectAll(".Bars1")
			.data(numCountriesRegionData, function key(d) { return d.key});

		bars2 = svg3.selectAll(".Bars2")
			.data(numCountriesGovData, function key(d) { return d.key});


		//****************** HANDLE UPDATE SELECTION **********************//
		// Create Transition object
		var t = d3.transition()
		    .duration(500)
		    .ease(d3.easeLinear);

		mainGroups.transition(t)
			.attr("x", function(d) { return xScale(d.GDP); })
			.attr("y", function(d) { return yScale(d.LifeExp); })
				.selectAll("circle")
				.attr("r", function(d) { return Math.sqrt(popScale(d.Population)/Math.PI); })
				.attr("cx", function(d) { return xScale(d.GDP); })
				.attr("cy", function(d) { return yScale(d.LifeExp); });

		names.transition(t)
			.attr("x", function(d) { return xScale(d.GDP); })
			.attr("y", function(d) { return yScale(d.LifeExp); });

		// Transition object for bar charts (want elastic rather than linear...)
		var t2 = d3.transition()
		    .duration(500)
		    .ease(d3.easeElastic);

		bars1.transition(t2)
			.attr("class", "Bars1")
			.attr("x", 0)
			.attr("y", function(d) { return yScaleBar1(d.key); })
			.attr("width", function(d) { return xScaleBar1(d.value); })
			.attr("height", function(d) { return yScaleBar1.bandwidth(); });

		bars2.transition(t2)
			.attr("class", "Bars2")
			.attr("x", 0)
			.attr("y", function(d) { return yScaleBar2(d.key); })
			.attr("width", function(d) { return xScaleBar2(d.value); })
			.attr("height", function(d) { return yScaleBar2.bandwidth(); });

		   
		//******** HANDLE ENTER SELECTION ************/
		// For the onhover div functionality to show text on the visualisation's circles
		var tooltip = d3.select("body")
			.append("div")
			.attr("class", "well well-sm")
			.style("position", "absolute")
			.style("z-index", "10")
			.style("visibility", "hidden");

		mainGroups.enter()
			.append("g")
			.attr("class", "MainGroups")
			.attr("x", function(d) { return xScale(d.GDP); })
			.attr("y", function(d) { return yScale(d.LifeExp); })
			.on("click", function(d){
				// Do something?
			})
				.append("circle")
				.attr("class", function(d) {
					if (d.Region == "North America" || d.Region == "Central America" || d.Region == "South America") {
						return "america";
					} else if (d.Region == "Africa") {
						return "africa";
					} else if (d.Region == "Europe") {
						return "europe";
					} else {
						return "asia";
					}
				})
				.attr("r", function(d) { return Math.sqrt(popScale(d.Population)/Math.PI); })
				.attr("cx", function(d) { return xScale(d.GDP); })
				.attr("cy", function(d) { return yScale(d.LifeExp); })
				.attr("stroke", "Black")
				.attr("stroke-width", "0.5")
				.attr("fill", function(d) {
					if (d.Region == "North America" || d.Region == "Central America" || d.Region == "South America") {
						return "#2c7bb6";
					} else if (d.Region == "Africa") {
						return "#abd9e9";
					} else if (d.Region == "Europe") {
						return "#fdae61";
					} else {
						return "#d7191c";
					}
				})
				.attr("opacity", 0.9)
				.on("mouseover", function(d){
					tooltip.text(d.Country);
					return tooltip.style("visibility", "visible");
				})
				.on("mousemove", function(){
					return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
				})
				.on("mouseout", function(){
					return tooltip.style("visibility", "hidden");
				});

		mainGroups.enter().raise()
			.append("text")
			.attr("class", "Names")
			.attr("x", function(d) { return xScale(d.GDP); })
			.attr("y", function(d) { return yScale(d.LifeExp); })
			.text(function(d){
				if (d.Population > 60000000) return d.Country;
			})
			.style("font-size", "20px");

		bars1.enter()
			.append("rect")
			.attr("class", "Bars1")
			.attr("x", 0)
			.attr("y", function(d) { return yScaleBar1(d.key); })
			.attr("width", function(d) { return xScaleBar1(d.value); })
			.attr("height", function(d) { return yScaleBar1.bandwidth(); })
			.attr("fill", "steelblue")
			.on("mouseover", function(d){
				d3.select(this).attr("fill", "#ff9900");
				tooltip.text(d.value);
				return tooltip.style("visibility", "visible");
			})
			.on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
			.on("mouseout", function(){
				d3.select(this).attr("fill", "steelblue");
				return tooltip.style("visibility", "hidden");
			});

		bars2.enter()
			.append("rect")
			.attr("class", "Bars2")
			.attr("x", 0)
			.attr("y", function(d) { return yScaleBar2(d.key); })
			.attr("width", function(d) { return xScaleBar2(d.value); })
			.attr("height", function(d) { return yScaleBar2.bandwidth(); })
			.attr("fill", "steelblue")
			.on("mouseover", function(d){
				d3.select(this).attr("fill", "#ff9900");
				tooltip.text(d.value);
				return tooltip.style("visibility", "visible");
			})
			.on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
			.on("mouseout", function(){
				d3.select(this).attr("fill", "steelblue");
				return tooltip.style("visibility", "hidden");
			});

		// //******** HANDLE EXIT SELECTION ************/   
		bubbles.exit().remove();
		bars1.exit().remove();
		bars2.exit().remove();
		mainGroups.exit().remove();
	}
}


function drawYear() {
	d3.select(".yearCenter").remove();
	// Add Year to center
	centerYear = svg1.append("text")
		.attr("class", "yearCenter")
		.attr("x", svg1_width/2)
		.attr("y", (svg1_height/2)+110)
		.text(display_year)
		.style("font-size", "280px")
		.style("fill", "grey")
		.attr("opacity", 0.3)
		.attr("text-anchor", "middle")
		.lower();	
}


function drawTrace(country) {

	currentFilter = undefined; 
	
	// Draw trace of country's path to 2016
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

			// Reset Opacity
			d3.selectAll(".europe").attr("opacity", 0.1);
			d3.selectAll(".asia").attr("opacity", 0.1);
			d3.selectAll(".america").attr("opacity", 0.1);
			d3.selectAll(".africa").attr("opacity", 0.1);

			// Get the data for that one country
			var allCountries = d3.nest()
				.key(function(d) { return d.Country; })
				.entries(data);

			var countryData = getTraceData(country, allCountries);

			// Data Join ***********************************************************************8
			traceBubblesGroups = svg1.selectAll(".traceBubblesGroups")
				.data(countryData, function key(d) { return d.Year; });

			traceBubbles = svg1.selectAll(".traceBubbles")
				.data(countryData, function key(d) { return d.Year; });

			// Data Update ********************************************************************

			// Create Transition object
			var t = d3.transition()
			    .duration(500)
			    .ease(d3.easeLinear);

			traceBubblesGroups.transition(t)
				.attr("x", function(d) { return xScale(d.GDP); })
				.attr("y", function(d) { return yScale(d.LifeExp); })

			traceBubbles.transition(t)
				.attr("cx", function(d) { return xScale(d.GDP); })
				.attr("cy", function(d) { return yScale(d.LifeExp); })
				.attr("r", function(d) { return Math.sqrt(popScale(d.Population)/Math.PI); });

			// Data Enter ***************************************************************************
			var tooltip = d3.select("body")
				.append("div")
				.attr("class", "well well-sm")
				.style("position", "absolute")
				.style("z-index", "10")
				.style("visibility", "hidden");

			traceBubblesGroups.enter()
				.append("g")
				.attr("class", "traceBubblesGroups")
				.attr("x", function(d) { return xScale(d.GDP); })
				.attr("y", function(d) { return yScale(d.LifeExp); })
					.append("circle")
					.attr("class", "traceBubbles")
					.attr("cx", function(d) { return xScale(d.GDP); })
					.attr("cy", function(d) { return yScale(d.LifeExp); })
					.attr("r", function(d) { return Math.sqrt(popScale(d.Population)/Math.PI); })
					.attr("fill", "#ff0066")
					.attr("stroke", "black")
					.attr("stroke-width", "0.3")
					.attr("opacity", 1)
					.on("mouseover", function(d){
						d3.select(this).attr("fill", "#ffcce0").raise()
					    tooltip.text(d.Year);
						return tooltip.style("visibility", "visible");
					})
					.on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
					.on("mouseout", function(){

						d3.select(this).attr("fill", "#ff0066")
						return tooltip.style("visibility", "hidden");
					});		


			// Data Exit ***********************************************************************
			traceBubbles.exit().remove();
			traceBubblesGroups.exit().remove();
		}
	});
}

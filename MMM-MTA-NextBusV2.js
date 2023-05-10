/* global Module */

/* Magic Mirror
 * Module: MMM-MTA-NextBus
 *
 * By 
 * MIT Licensed.
 */

Module.register("MMM-MTA-NextBusV2", {
	defaults: {
		timeFormat: config.timeFormat,
		maxEntries: 3,
		updateInterval: 60000,
		retryDelay: 5000
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;

		//Flag for check if module is loaded
		//this.loaded = false;
		console.log(this.config.timeFormat);
		this.sendSocketNotification("CONFIG", this.config);

		// Schedule update timer.
		setInterval(function() {
			self.sendSocketNotification("GET_DATA");
		}, this.config.updateInterval);
		
	},	

	getDom: function() {
	var self = this;

	// create table element
	var table = document.createElement("table");
	table.className = "small";

	// create table headers
	var tableHeaderRow = document.createElement("tr");
	var routeHeader = document.createElement("th");
	routeHeader.innerHTML = "Bus Route";
	var arrivalHeader = document.createElement("th");
	arrivalHeader.innerHTML = "Arrival Time";
	var distanceHeader = document.createElement("th");
	distanceHeader.innerHTML = "Distance";
	var stopsHeader = document.createElement("th");
	stopsHeader.innerHTML = "Stops";
	tableHeaderRow.appendChild(routeHeader);
	tableHeaderRow.appendChild(arrivalHeader);
	tableHeaderRow.appendChild(distanceHeader);
	tableHeaderRow.appendChild(stopsHeader);
	table.appendChild(tableHeaderRow);

	// If this.dataRequest is not empty
	if (this.dataRequest) {
		this.dataRequest.forEach(function(data, i) {
			if (data.startsWith('Last Updated: ')) {
				// create row for last updated time
				var lastUpdatedRow = document.createElement("tr");
				var lastUpdatedCell = document.createElement("td");
				lastUpdatedCell.setAttribute("colspan", "4");
				lastUpdatedCell.innerHTML = data;
				lastUpdatedCell.classList.add('last-updated');
				lastUpdatedRow.appendChild(lastUpdatedCell);
				table.appendChild(lastUpdatedRow);
			} else {
				// create row for bus data
				var busRow = document.createElement("tr");
				var busData = data.split(", ");
				for (var j = 0; j < busData.length; j++) {
					var busCell = document.createElement("td");
					var busDataSplit = busData[j].split(" ");
					if (busDataSplit.length === 3 && busDataSplit[2] === "away") {
						busCell.innerHTML = busDataSplit[0] + " " + busDataSplit[1];
					} else {
						busCell.innerHTML = busData[j];
					}
					busRow.appendChild(busCell);
				}
				table.appendChild(busRow);
			}
		});
	}
	
	return table;
	},



	getScripts: function() {
		return ["moment.js"];
	},

	getStyles: function () {
		return [
			"MMM-MTA-NextBusV2.css",
		];
	},

	processData: function(data) {
		var self = this;
		this.dataRequest = self.processActionNextBus(data);
		self.updateDom(self.config.animationSpeed);
		//if (this.loaded === false) {  ; }
		//this.loaded = true;

		// the data if load
		// send notification to helper
		//this.sendSocketNotification("MMM-MTA-NextBus-NOTIFICATION_TEST", data);
	},

	processActionNextBus: function(response) {
		
		var result = [];
		
		var serviceDelivery = response.Siri.ServiceDelivery;
		var updateTimestampReference = new Date(serviceDelivery.ResponseTimestamp);
		
		//console.log(updateTimestampReference);
		
		// array of buses
		var visits = serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit;
		var visitsCount = Math.min(visits.length, this.config.maxEntries);
		
		for (var i = 0; i < visitsCount; i++) {
			r = '';

			var journey = visits[i].MonitoredVehicleJourney;
			var line = journey.PublishedLineName[0]; 
			
			var destinationName = journey.DestinationName[0];
			if (destinationName.startsWith('LIMITED')) {
				line += ' LIMITED';
			}
			
			r += line + ', ';
			
			var monitoredCall = journey.MonitoredCall;
			// var expectedArrivalTime = new Date(monitoredCall.ExpectedArrivalTime);
			if (monitoredCall.ExpectedArrivalTime) {
				var mins = this.getArrivalEstimateForDateString(monitoredCall.ExpectedArrivalTime, updateTimestampReference);
				r += mins + ', ';
			}
			
			
			var distance = monitoredCall.ArrivalProximityText;
			r += distance + ', ';
			
			
			var stopsAway = journey.MonitoredCall.NumberOfStopsAway;
			r += stopsAway + ' stop' + ((Math.abs(stopsAway) === 1) ? '' : 's') + ' away';


			result.push(r);
		}



		result.push('Last Updated: ' + this.formatTimeString(updateTimestampReference));
		
		return result;
	},

	getArrivalEstimateForDateString: function(dateString, refDate) {
		var d = new Date(dateString);
		
		var mins = Math.floor((d - refDate) / 60 / 1000);
		
		return mins + ' minute' + ((Math.abs(mins) === 1) ? '' : 's');
	},

	formatTimeString: function(date) {
		var m = moment(date);

		var hourSymbol = "HH";
		var periodSymbol = "";

		if (this.config.timeFormat !== 24) {
			hourSymbol = "h";
			periodSymbol = " A";
		}

		var format = hourSymbol + ":mm" + periodSymbol;

		return m.format(format);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if (notification === "DATA") {
			this.processData(payload);
		} else if (notification === "ERROR") {
			self.updateDom(self.config.animationSpeed);
		} 
	},
});

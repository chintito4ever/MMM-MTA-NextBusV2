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
		maxEntries: 5,
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
	  var wrapper = document.createElement("div");
	  wrapper.className = "nextbus";

	  if (!this.dataRequest) {
	    wrapper.innerHTML = "Loading...";
	    return wrapper;
	  }

	  var table = document.createElement("table");
	  table.className = "small";

	  this.dataRequest.forEach(function(bus) {
	    var tr = document.createElement("tr");

	    var tdLine = document.createElement("td");
	    tdLine.innerHTML = bus.PublishedLineName;
	    tr.appendChild(tdLine);

	    var tdDest = document.createElement("td");
	    tdDest.innerHTML = bus.DestinationName;
	    tr.appendChild(tdDest);

	    var tdTime = document.createElement("td");
	    tdTime.innerHTML = bus.ExpectedArrivalTime;
	    tr.appendChild(tdTime);

	    table.appendChild(tr);
	  });

	  wrapper.appendChild(table);

	  var lastUpdate = document.createElement("div");
	  lastUpdate.innerHTML = "Last Updated: " + this.formatTimeString(this.lastUpdate);
	  lastUpdate.className = "xsmall last-update";
	  wrapper.appendChild(lastUpdate);

	  return wrapper;
	},

	getScripts: function() {
		return ["moment.js"];
	},

	getStyles: function() {
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

	  // Get the current time from the response, as a reference for calculating time differences
	  var responseTimestamp = new Date(serviceDelivery.ResponseTimestamp);

	  // Iterate over the MonitoredStopVisit array
	  var monitoredStopVisits = serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit;
	  for (var i = 0; i < monitoredStopVisits.length && i < this.config.maxEntries; i++) {
	    var monitoredVehicleJourney = monitoredStopVisits[i].MonitoredVehicleJourney;
	    var publishedLineName = monitoredVehicleJourney.PublishedLineName[0];
	    var destinationName = monitoredVehicleJourney.DestinationName[0];
	    var arrivalTime = monitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime;

	    // Check if the expected arrival time is provided in the response
	    if (arrivalTime) {
	      // Calculate the time difference between the expected arrival time and the response timestamp, in minutes
	      var arrivalTimeDiff = Math.floor((new Date(arrivalTime) - responseTimestamp) / 60000);

	      // Format the arrival time difference as a string, e.g. "2 minutes"
	      var arrivalTimeStr = arrivalTimeDiff + " minute" + (arrivalTimeDiff === 1 ? "" : "s");

	      // Build the result string for this stop
	      var resultStr = publishedLineName + ", " + arrivalTimeStr + ", " + destinationName;
	      result.push(resultStr);
	    }
	  }

	  // Add the "last updated" string to the result array
	  var lastUpdatedStr = "Last updated: " + this.formatTimeString(responseTimestamp);
	  result.push(lastUpdatedStr);

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
	socketNotificationReceived: function(notification, payload) {
	    if (notification === "DATA") {
		console.log(payload); // Add this line
		this.processData(payload);
	    } else if (notification === "ERROR") {
		self.updateDom(self.config.animationSpeed);
	    }
	},

});

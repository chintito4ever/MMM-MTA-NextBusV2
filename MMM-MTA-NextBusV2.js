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
		tdLine.innerHTML = bus.lineRef;
		tr.appendChild(tdLine);

		var tdDirection = document.createElement("td");
		tdDirection.innerHTML = bus.directionRef;
		tr.appendChild(tdDirection);

		var tdDistance = document.createElement("td");
		tdDistance.innerHTML = bus.distanceFromStop;
		tr.appendChild(tdDistance);

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
	    var updateTimestampReference = new Date(serviceDelivery.ResponseTimestamp);

	    // array of buses
	    var monitoredStopVisit = serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit;

	    for (var i = 0; i < monitoredStopVisit.length && i < this.config.maxEntries; i++) {
		var journey = monitoredStopVisit[i].MonitoredVehicleJourney;

		var line = journey.PublishedLineName[0];
		var destinationName = journey.DestinationName[0];

		var monitoredCall = journey.MonitoredCall;
		var distance = monitoredCall.ArrivalProximityText;

		var r = line + " to " + destinationName + ", " + distance;
		result.push(r);
	    }

	    result.push('Last Updated: ' + this.formatTimeString(updateTimestampReference));

	    return result;
	},


	getArrivalEstimateForDateString: function(dateString, refDate) {
		var d = new Date(dateString);

		var mins = Math.floor((d - refDate) / 60 / 1000);

		return mins + ' minute'
	},

	// This function is called when a socket notification arrives.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "DATA") {
			this.processData(payload);
		} else if (notification === "ERROR") {
			this.updateDom(this.config.animationSpeed);
		}
	}
});

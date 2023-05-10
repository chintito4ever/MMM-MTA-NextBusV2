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
	    var self = this;

	    // create element wrapper for show into the module
	    var wrapper = document.createElement("div");

	    if (this.loaded && this.dataRequest) {
		this.dataRequest.forEach(function(data, i) {
		    if (data.line) {
			var wrapperDataRequest = document.createElement("div");
			wrapperDataRequest.innerHTML = 'Bus ' + data.PublishedLineName + ' to ' + data.DestinationName + ' arriving ' + self.getArrivalEstimateForDateString(data.ExpectedArrivalTime);
			wrapperDataRequest.className = "small";
			wrapper.appendChild(wrapperDataRequest);
		    } else if (data.updateTimestamp) {
			var wrapperTimestamp = document.createElement("div");
			wrapperTimestamp.innerHTML = "Last Updated: " + self.formatTimeString(data.updateTimestamp);
			wrapperTimestamp.className = "xsmall dimmed";
			wrapper.appendChild(wrapperTimestamp);
		    }
		});
	    } else {
		var wrapperNoData = document.createElement("div");
		wrapperNoData.innerHTML = this.loaded ? "No buses found." : "Loading buses ...";
		wrapperNoData.className = "small dimmed";
		wrapper.appendChild(wrapperNoData);
	    }

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

	    //console.log(updateTimestampReference);

	    // array of buses
	    var visits = serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit;
	    var visitsCount = Math.min(visits.length, this.config.maxEntries);

	    for (var i = 0; i < visitsCount; i++) {
		var data = {};

		var journey = visits[i].MonitoredVehicleJourney;
		var line = journey.PublishedLineName[0];
		var destination = journey.DestinationName[0];

		if (destination.startsWith('LIMITED')) {
		    line += ' LIMITED';
		}

		var monitoredCall = journey.MonitoredCall;
		var arrivalTime = monitoredCall.ArrivalProximityText;

		data.line = line;
		data.destination = destination;
		data.arrivalTime = arrivalTime;

		result.push(data);
	    }

	    result.push({
		updateTimestamp: updateTimestampReference
	    });

	    this.dataRequest = result;

	    this.loaded = true;
	    this.updateDom(this.config.animationSpeed);
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

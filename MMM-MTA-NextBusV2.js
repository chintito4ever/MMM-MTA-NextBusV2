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
	  // If this.dataRequest is not empty
	  if (this.dataRequest) {
	    this.dataRequest.forEach(function(data, i) {
	      var wrapperDataRequest = document.createElement("div");

	      var line = data.MonitoredVehicleJourney.PublishedLineName;
	      var destination = data.MonitoredVehicleJourney.DestinationName;
	      var arrivalTime = data.MonitoredVehicleJourney.MonitoredCall.ArrivalProximityText;

	      wrapperDataRequest.innerHTML = 'Bus ' + line + ' to ' + destination + ' arriving ' + arrivalTime;
	      wrapperDataRequest.className = "small";

	      wrapper.appendChild(wrapperDataRequest);
	    });
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
	  var self = this;
	  if (response.data.Siri.ServiceDelivery.VehicleMonitoringDelivery) {
	    var buses = response.data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity;
	    var dataRequest = [];
	    buses.forEach(function(bus) {
	      dataRequest.push(bus);
	    });
	    self.dataRequest = dataRequest;
	    self.updateDom();
	  } else {
	    Log.info('Next Bus Error. No data.');
	  }
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

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

  start: function () {
    var self = this;
    this.dataRequest = [];
    this.sendSocketNotification("CONFIG", this.config);

    // Schedule update timer.
    setInterval(function () {
      self.sendSocketNotification("GET_DATA");
    }, this.config.updateInterval);
  },

  getDom: function () {
    var self = this;

    // create element wrapper for show into the module
    var wrapper = document.createElement("table");
    wrapper.className = "small";

    // If this.dataRequest is not empty
    if (this.dataRequest) {
      this.dataRequest.forEach(function (data, i) {
        var row = document.createElement("tr");
        var busCell = document.createElement("td");
        var timeCell = document.createElement("td");
        var distanceCell = document.createElement("td");

        var busText = document.createTextNode(data.bus);
        var timeText = document.createTextNode(data.time);
        var distanceText = document.createTextNode(data.distance);

        busCell.appendChild(busText);
        timeCell.appendChild(timeText);
        distanceCell.appendChild(distanceText);

        row.appendChild(busCell);
        row.appendChild(timeCell);
        row.appendChild(distanceCell);

        wrapper.appendChild(row);
      });
    }

    return wrapper;
  },

  getScripts: function () {
    return ["moment.js"];
  },

  getStyles: function () {
    return ["MMM-MTA-NextBusV2.css"];
  },

  processData: function (data) {
    var self = this;
    this.dataRequest = self.processActionNextBus(data);
    self.updateDom(self.config.animationSpeed);
  },

  processActionNextBus: function (response) {
    var result = [];
    var serviceDelivery = response.Siri.ServiceDelivery;
    var updateTimestampReference = new Date(serviceDelivery.ResponseTimestamp);

    var visits = serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit;
    var visitsCount = Math.min(visits.length, this.config.maxEntries);

    for (var i = 0; i < visitsCount; i++) {
      var r = {};

      var journey = visits[i].MonitoredVehicleJourney;
      var line = journey.PublishedLineName[0];

      var destinationName = journey.DestinationName[0];
      if (destinationName.startsWith("LIMITED")) {
        line += " LIMITED";
      }

      r.bus = line;

      var monitoredCall = journey.MonitoredCall;
      if (monitoredCall.ExpectedArrivalTime) {
        r.time = this.getArrivalEstimateForDateString(monitoredCall.ExpectedArrivalTime, updateTimestampReference);
      }

      r.distance = monitoredCall.ArrivalProximityText;

      result.push(r);
    }

    result.push({ updateTime: this.formatTimeString(updateTimestampReference) });

    return result;
  },

  getArrivalEstimateForDateString: function (dateString, refDate) {
    var d = new Date(dateString);
    var mins = Math.floor((d - refDate) / 60 / 1000);
    return mins + " minute" + (Math.abs(mins) === 1 ? "" : "s");
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

	notificationReceived: function(notification, payload, sender) {
		if (notification === "DOM_OBJECTS_CREATED") {
			// Do any DOM manipulation here.
			// This is triggered when the module has been
			// initialized and the DOM is ready.
		}
	},

	// Load translations files
	getTranslations: function() {
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	}
});

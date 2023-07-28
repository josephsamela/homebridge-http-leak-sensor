let Service, Characteristic
import fetch from 'node-fetch';

module.exports = (homebridge) => {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-http-leak-sensor', 'HomebridgeHTTPLeakSensor', LeakSensorAccessory);
};

class LeakSensorAccessory {

  log: any;
  config: any;
  api: any;
  url: any;
  name: any;
  pollInterval: any;
  manufacturer: any;
  model: any;
  serialNumber: any;
  service: any;

  constructor(log, config, api) {
      this.log = log
      this.config = config
      this.api = api

      this.url = config.url                   || 'http://localhost/status'
      this.name = config.name                 || 'Leak Sensor'
      this.pollInterval = config.pollInterval || 60

      this.manufacturer = config.manufacturer || 'Homebridge'
      this.model = config.model               || 'Leak Sensor'
      this.serialNumber = config.serialNumber || '000000'

      this.service = new Service.LeakSensor(this.name)
  }

  getServices() {
    const informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
        .setCharacteristic(Characteristic.Model, this.model)
        .setCharacteristic(Characteristic.SerialNumber, this.serialNumber)

    this.service.getCharacteristic(Characteristic.LeakDetected)
      .on('get', this.handleLeakSensorGetState.bind(this))

    setInterval(function (this) {
      this.handleLeakSensorSetState(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [informationService, this.service]
  }

  async handleLeakSensorSetState() {
    // This function runs on a regular interval to update the state of the sensor.
    // The interval is configured by the "pollInterval" config item.
    
    const response = await fetch(this.url);
    const data = await response.json();
    const currentState = data['currentState']

    if (currentState == "WET") {
      var currentValue = Characteristic.LeakDetected.LEAK_DETECTED;
    }
    else if (currentState == "DRY") {
      var currentValue = Characteristic.LeakDetected.LEAK_NOT_DETECTED;
    }

    this.service.getCharacteristic(Characteristic.LeakDetected).updateValue(currentValue)
    this.log.debug('Leak Sensor State: ' + currentValue);

    return currentValue
  }

  async handleLeakSensorGetState(callback) {
    // This function responds to Homekit requests for the current state of the Leak Sensor.    
    const currentValue = await this.handleLeakSensorSetState()
    callback(null, currentValue)
  }

}
let Service, Characteristic;
import fetch from 'node-fetch';

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-http-leak-sensor', 'HomebridgeHTTPLeakSensor', LeakSensorAccessory);
};

class LeakSensorAccessory {

  log: any;
  config: object;
  api: object;
  url: string;
  name: string;
  pollInterval: number;
  failedRequestsLimit: number;
  failedRequests: number;
  manufacturer: string;
  model: string;
  serialNumber: string;
  service: any;

  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.url = config.url || 'http://localhost/status';
    this.name = config.name || 'Leak Sensor';
    this.pollInterval = config.pollInterval || 60;

    // This property sets the limit of failed requests that can be made to
    // url before the plugin stops making requests. Value of `0` allows
    // unlimited failed requests.
    this.failedRequestsLimit = config.failedRequestsLimit || 120;

    // This property tracks the number of failed requests made to the sensor.
    // when the number of failed requests exceeds the `failedRequestsLimit` the
    // plugin will stop requesting. If the device responds this is reset to 0.
    this.failedRequests = 0;

    this.manufacturer = config.manufacturer || 'Homebridge';
    this.model = config.model || 'Leak Sensor';
    this.serialNumber = config.serialNumber || '000000';

    this.service = new Service.LeakSensor(this.name);
  }

  getServices() {
    const informationService = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serialNumber);

    this.service.getCharacteristic(Characteristic.LeakDetected)
      .on('get', this.handleLeakSensorGetState.bind(this));

    setInterval(function (this) {
      this.handleLeakSensorSetState();
    }.bind(this), this.pollInterval * 1000);

    return [informationService, this.service];
  }

  async handleLeakSensorSetState() {
    // This function runs on a regular interval to update the state of the sensor.
    // The interval is configured by the "pollInterval" config item.
    if (this.failedRequestsLimit === 0 || this.failedRequests < this.failedRequestsLimit) {
      try {
        const response = await fetch(this.url);
        const data = await response.json();
        const currentState = data['currentState'];

        if (currentState === 'WET') {
          this.service.getCharacteristic(Characteristic.LeakDetected)
            .updateValue(Characteristic.LeakDetected.LEAK_DETECTED);
          this.log.debug('Sensor state: LEAK_DETECTED');
        } else if (currentState === 'DRY') {
          this.service.getCharacteristic(Characteristic.LeakDetected)
            .updateValue(Characteristic.LeakDetected.LEAK_NOT_DETECTED);
          this.log.debug('Sensor state: LEAK_NOT_DETECTED');
        } else {
          this.log.warn('Sensor state: UNKNOWN "'+currentState+'"');
        }
        this.failedRequests = 0;
      } catch(e: unknown) {
        this.failedRequests += 1;
        this.log.warn(`Unable to communicate with device. Failed request ${this.failedRequests}}/${this.failedRequestsLimit} ` + e);
      }
    }
  }

  async handleLeakSensorGetState(callback) {
    // This function responds to Homekit requests for the current state of the Leak Sensor.
    const currentState = this.service.getCharacteristic(Characteristic.LeakDetected).value;
    callback(null, currentState);
  }

}
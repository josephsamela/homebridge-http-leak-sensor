let Service, Characteristic

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
  service: any;

  constructor(log, config, api) {
      this.log = log
      this.config = config
      this.api = api

      this.url = config.url
      this.name = config.name || 'Leak Sensor'
      this.pollInterval = config.pollInterval || 10

      this.service = new Service.LeakSensor(this.name)
  }

  getServices() {
    this.log.debug('GetServices');

    const informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'oznu')
        .setCharacteristic(Characteristic.Model, 'SwitchExample')
        .setCharacteristic(Characteristic.SerialNumber, 'oznu-switch-example')

    this.service.getCharacteristic(Characteristic.LeakDetected)
      .on('get', this.handleLeakDetectedGet.bind(this))

    setInterval(function (this) {
      this.handleLeakDetectedGet(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [informationService, this.service]
  }

  handleLeakDetectedGet(callback) {
    if (Math.random() > 0.5) {
      var currentValue = Characteristic.LeakDetected.LEAK_DETECTED;
    } else {
      var currentValue = Characteristic.LeakDetected.LEAK_NOT_DETECTED;
    }
    
    this.log.debug('handleLeakDetectedGet: ' + currentValue);

    callback(null, currentValue)
  }

}
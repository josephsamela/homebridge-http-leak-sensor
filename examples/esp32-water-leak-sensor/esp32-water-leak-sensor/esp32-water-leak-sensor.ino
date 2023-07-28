#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <ESPmDNS.h>

const char* ssid = "...................";
const char* password = "...................";

WebServer server(80);

const int led    = 2;
const int sensor = 15;

int requestedState = 1; // open=0, closed=1
int currentState = 1; // open=0, closed=1
int lockExpire = 0; 

void setup() {
  // Initialize Serial
  Serial.begin(115200);
     
  // Connect to WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
 
  // Connect to wifi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  WiFi.setSleep(false);
  
  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  if (MDNS.begin("esp32-water-leak-sensor")) {
    Serial.println("MDNS responder started");
  }

  // Setup GPIO pin modes
  pinMode(led, OUTPUT);
  pinMode(sensor, INPUT);
  
  // Start with LED ON
  digitalWrite(led, HIGH);

  server.on("/", []() {
    server.send(200, "text/plain", "This is Joe's Leak Detection Sensor!\nSend a GET request to an endpoint below: \n\n`/status`\t\tGet JSON status of sensor.\n");
  });

  server.on("/status", []() {
    digitalWrite(led, LOW);
    if (digitalRead(sensor) == HIGH ) {
      // Report status WET
      Serial.println("{\"currentState\": \"WET\"");
      server.send(200, "text/plain", "{\"currentState\": \"WET\"}\n");
    } else {
      // Report status DRY
      Serial.println("{\"currentState\": \"DRY\"");
      server.send(200, "text/plain", "{\"currentState\": \"DRY\"}\n");
    }
    delay(100);
    digitalWrite(led, HIGH);
  });

  server.onNotFound([]() {
    digitalWrite(led, 1);
    String message = "Route Not Found\n\n";
    message += "URI: ";
    message += server.uri();
    message += "\nMethod: ";
    message += (server.method() == HTTP_GET) ? "GET" : "POST";
    message += "\nArguments: ";
    message += server.args();
    message += "\n";
    for (uint8_t i = 0; i < server.args(); i++) {
      message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
    }
    server.send(404, "text/plain", message);
  });

  server.begin();
  Serial.println("HTTP server started");

}

void loop() { 
  server.handleClient();
  delay(2); //allow the cpu to switch to other tasks
}

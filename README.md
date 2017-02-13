# ui-driver-cloudca
cloud.ca Rancher UI driver for the [cloud.ca docker-machine driver](https://github.com/cloud-ca/docker-machine-driver-cloudca)

# Configuring in Rancher

* Add a Machine Driver in Rancher (Admin tab -> Settings -> Machine Drivers)
  * Name: cloud.ca
  * Download URL: The URL for the cloud.ca docker-machine **_Linux 64-bit_** driver (copy the URL from the [Releases page](https://github.com/cloud-ca/docker-machine-driver-cloudca/releases/latest)).
  * Custom UI URL: The URL to the cloud.ca custom Rancher UI **_component.js_** file (copy the URL from the [Releases page](https://github.com/cloud-ca/ui-driver-cloudca/releases/latest)).
* Wait for the driver to become "Active"
* Go to Infrastructure -> Hosts -> Add Host, your driver and custom UI should show up.

# Developing the custom UI
## Setup

* `npm install`
* `bower install`

## Development

This package contains a small web-server that will serve up the custom driver UI at `http://localhost:3000/component.js`.  You can run this while developing and point the Rancher settings there.
* `npm start`
* The driver name can be optionally overridden: `npm start -- --name=DRIVERNAME`
* The compiled files are viewable at http://localhost:3000.
* **Note:** The development server does not currently automatically restart when files are changed.

## Building

For other users to see your driver, you need to build it and host the output on a server accessible from their browsers.

* `npm build`
* Copy the contents of the `dist` directory onto a webserver.
  * If your Rancher is configured to use HA or SSL, the server must also be available via HTTPS.


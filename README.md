# ui-driver-cloudca
cloud.ca Rancher UI driver for the [cloud.ca docker-machine driver](https://github.com/cloud-ca/docker-machine-driver-cloudca)

**Note: The Master branch works with Rancher 2.x+, if you are building a custom driver for Rancher 1.x use the v1.0.3 tag**

# Configuring in Rancher

* Add a Machine Driver in Rancher 2.0 (Global -> Node Drivers)
  * Download URL: `https://github.com/cloud-ca/docker-machine-driver-cloudca/files/2446837/docker-machine-driver-cloudca_v2.0.0_linux-amd64.zip`
  * Custom UI URL:`https://github.com/cloud-ca/ui-driver-cloudca/releases/download/v2.0.0/component.js`)
* Wait for the driver to become "Active"
* Go to Clusters -> Add Cluster, your driver and custom UI should show up.

## Development

This package contains a small web-server that will serve up the custom driver UI at `http://localhost:3000/component.js`.  You can run this while developing and point the Rancher settings there.
* `npm start`
* The driver name can be optionally overridden: `npm start -- --name=cloudca`
* The compiled files are viewable at http://localhost:3000.
* **Note:** The development server does not currently automatically restart when files are changed.
* Do not use the `model.<drivername>Confg` signature to access your driver config in the template file, use the `config` alias that is already setup in the component

## Building

For other users to see your driver, you need to build it and host the output on a server accessible from their browsers.

* `npm run build`
* Copy the contents of the `dist` directory onto a webserver.
  * If your Rancher is configured to use HA or SSL, the server must also be available via HTTPS.

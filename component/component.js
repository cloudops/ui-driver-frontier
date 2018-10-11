/*!!!!!!!!!!!Do not change anything between here (the DRIVERNAME placeholder will be automatically replaced at buildtime)!!!!!!!!!!!*/
import NodeDriver from 'shared/mixins/node-driver';

// do not remove LAYOUT, it is replaced at build time with a base64 representation of the template of the hbs template
// we do this to avoid converting template to a js file that returns a string and the cors issues that would come along with that
const LAYOUT;
/*!!!!!!!!!!!DO NOT CHANGE END!!!!!!!!!!!*/


/*!!!!!!!!!!!GLOBAL CONST START!!!!!!!!!!!*/
// EMBER API Access - if you need access to any of the Ember API's add them here in the same manner rather then import them via modules, since the dependencies exist in rancher we dont want to expor the modules in the amd def
const computed = Ember.computed;
const get = Ember.get;
const set = Ember.set;
const alias = Ember.computed.alias;
const service = Ember.inject.service;

const defaultRadix = 10;
const defaultBase = 1024;
/*!!!!!!!!!!!GLOBAL CONST END!!!!!!!!!!!*/



/*!!!!!!!!!!!DO NOT CHANGE START!!!!!!!!!!!*/
export default Ember.Component.extend(NodeDriver, {
  driverName: 'cloudca',
  config: alias('model.cloudcaConfig'),
  app: service(),

  init() {
    // This does on the fly template compiling, if you mess with this :cry:
    const decodedLayout = window.atob(LAYOUT);
    const template = Ember.HTMLBars.compile(decodedLayout, {
      moduleName: 'nodes/components/driver-cloudca/template'
    });
    set(this, 'layout', template);

    this._super(...arguments);

  },
  /*!!!!!!!!!!!DO NOT CHANGE END!!!!!!!!!!!*/

  // Write your component here, starting with setting 'model' to a machine with your config populated
  bootstrap: function () {
    // bootstrap is called by rancher ui on 'init', you're better off doing your setup here rather then the init function to ensure everything is setup correctly
    let config = get(this, 'globalStore').createRecord({
      type: 'cloudcaConfig',
      apiUrl: "https://api.cloud.ca/v1",
      usePrivateIp: true,
      sshUser: "cca-user",
    });
    set(this, 'model.cloudcaConfig', config);

    //Need to access `this` on new-select actions
    var self = this;

    set(this, "onTemplateChange", template => {
      self.set("config.sshUser", template.sshUser);
    });

    set(this, 'onComputeOfferingChange', co => {
      if (co.custom) {
        self.set("showCustomComputeOffering", true);
        self.set("config.cpuCount", 1);
        self.set("config.memoryMb", 2048);
      } else {
        self.set("showCustomComputeOffering", false);
        self.set("config.cpuCount", null);
        self.set("config.memoryMb", null);
      }
    });

    set(this, 'onDiskOfferingChange', o => {
      if (o.customSize) {
        self.set("showCustomDiskOffering", true);
        self.set("model.cloudcaConfig.additionalDiskSizeGb", 20);
      } else {
        self.set("showCustomDiskOffering", false);
        self.set("model.cloudcaConfig.additionalDiskSizeGb", null);
      }
    });
  },

  // Add custom validation beyond what can be done from the config API schema
  validate() {
    this._super();
    var errors = this.get('errors') || [];

    var name = this.get('model.hostname');
    if (name) {
      if (name.length > 62) {
        // Max is actually 63, but host naming goes alllll the way to 11, so we'll play it safe.
        errors.push('Name can be a maximum of 62 characters long.');
      } else if (!/^[a-zA-Z]/.test(name) || !/[a-zA-Z0-9]$/.test(name)) {
        errors.push('Name must start with a letter and end with a letter or digit.');
      } else if (!/^[-a-zA-Z0-9]+$/.test(name)) {
        errors.push('Name can only contain letters, digits and hyphens.');
      }
    }
    this.set('errors', errors);
    return !errors.length;
  },

  // Any computed properties or custom logic can go here

  //Start at API key page
  apiKeyPage: true,
  pages: ['apiKeyPage', 'envPage', 'computePage', 'nodeTemplate'],

  cpuOptions: [{
      name: '1 vCPU',
      value: 1
    },
    {
      name: '2 vCPU',
      value: 2
    },
    {
      name: '4 vCPU',
      value: 4
    },
    {
      name: '6 vCPU',
      value: 6
    },
    {
      name: '8 vCPU',
      value: 8
    },
    {
      name: '10 vCPU',
      value: 10
    },
    {
      name: '12 vCPU',
      value: 12
    },
    {
      name: '16 vCPU',
      value: 16
    },
  ],

  memOptions: [{
      name: '2 GB',
      value: 1024 * 2
    },
    {
      name: '4 GB',
      value: 1024 * 4
    },
    {
      name: '8 GB',
      value: 1024 * 8
    },
    {
      name: '12 GB',
      value: 1024 * 12
    },
    {
      name: '16 GB',
      value: 1024 * 16
    },
    {
      name: '20 GB',
      value: 1024 * 20
    },
    {
      name: '24 GB',
      value: 1024 * 24
    },
    {
      name: '28 GB',
      value: 1024 * 28
    },
    {
      name: '32 GB',
      value: 1024 * 32
    },
  ],

  setPage: function (pageNum) {
    this.set('errors', []);
    var self = this;
    this.pages.forEach((p, i) => {
      self.set(p, i === pageNum);
    });
  },
  actions: {
    goToApiKeyPage: function () {
      this.setPage(0);
    },
    goToEnvsPage: function () {
      this.apiCall('/environments', function (environments) {
        if (environments.errors) {
          this.set('errors', environments.errors.map(function (err) {
            return err.message;
          }));
          return;
        }

        var envs = environments.data.filter(function (env) {
          return env.serviceConnection.type.toLowerCase() === 'cloudca';
        });

        //environmentCodeName is env name and service code concatenated
        this.environmentsByCodeName = envs.reduce(function (m, e) {
          m[e.serviceConnection.serviceCode + e.name] = e;
          return m;
        }, {});

        this.set('environmentOptions', envs
          .map(function (env) {
            return {
              name: env.name,
              value: env.serviceConnection.serviceCode + env.name,
              group: env.serviceConnection.serviceCode
            };
          }));
        //set env code name from env name and servicecode
        if (this.config.serviceCode && this.config.environmentName) {
          this.set('config.environmentCodeName', this.config.serviceCode + this.config.environmentName);
        }
        this.setPage(1);
      }.bind(this));
    },
    goToComputePage: function () {
      var env = this.environmentsByCodeName[this.get('model.cloudcaConfig.environmentCodeName')];
      if (env) {
        this.set('model.cloudcaConfig.environmentName', env.name);
        this.set('model.cloudcaConfig.serviceCode', env.serviceConnection.serviceCode);
        this.loadNetworks();
        this.loadTemplates();
        this.loadComputeOfferings();
        this.loadDiskOfferings();
      }
      var errs = this.get('errors');
      if (errs && errs.length > 0) {
        return;
      }
      this.setPage(2);
    },
    goToNodeTemplatePage: function () {
      this.setPage(3);
    },
  },

  loadNetworks: function () {
    this.apiCall(this.getServicesApiEndpoint('networks'), function (listNetworksResponse) {
      if (listNetworksResponse.errors) {
        this.set('errors', listNetworksResponse.errors.map(function (err) {
          return err.message;
        }));
        return;
      }
      var networks = listNetworksResponse.data;
      this.set('networkOptions', networks.map(function (network) {
        return {
          name: network.name,
          value: network.id,
          group: network.vpcName
        };
      }));
      if (!this.config.networkId && networks.length > 0) {
        this.set('model.cloudcaConfig.networkId', networks[0].id);
      }
    }.bind(this));
  },

  loadComputeOfferings: function () {
    this.apiCall(this.getServicesApiEndpoint('computeofferings'), function (listComputeOfferingsResponse) {
      if (listComputeOfferingsResponse.errors) {
        this.set('errors', listComputeOfferingsResponse.errors.map(function (err) {
          return err.message;
        }));
        return;
      }
      var offerings = listComputeOfferingsResponse.data.filter(o => o.memoryInMB >= 2048 || o.custom);
      this.set('computeOfferingOptions', offerings
      .map(o => {
        return {
          name: o.name,
          value: o.id,
          custom: o.custom
        };
      }));

      if (!this.config.computeOffering && offerings.length > 0) {
        let off = offerings[0];
        this.set('model.cloudcaConfig.computeOffering', off.id);
        if(off.custom){
          this.set("showCustomComputeOffering", true);
          this.set("model.cloudcaConfig.cpuCount", 1);
          this.set("model.cloudcaConfig.memoryMb", 2048);
        }
      }
    }.bind(this));
  },

  loadDiskOfferings: function () {
    this.apiCall(this.getServicesApiEndpoint('diskofferings'), function (listDiskOfferingsResponse) {
      if (listDiskOfferingsResponse.errors) {
        this.set('errors', listDiskOfferingsResponse.errors.map(function (err) {
          return err.message;
        }));
        return;
      }
      var offeringOptions = listDiskOfferingsResponse.data.map(function (offering) {
        return {
          name: offering.name,
          value: offering.id,
          customSize: offering.customSize,
          customIops: offering.customIops
        };
      });
      offeringOptions.push({
        name: "No additional disk",
        value: ""
      })
      this.set('diskOfferingOptions', offeringOptions);
      if (!this.config.diskOffering && offeringOptions.length > 0) {
        let off = offeringOptions[0];
        this.set('model.cloudcaConfig.additionalDiskOffering', off.value);
        if(off.customSize){
          this.set("showCustomDiskOffering", true);
          this.set("model.cloudcaConfig.additionalDiskSizeGb", 20);
        }
      }
    }.bind(this));
  },

  loadTemplates: function () {
    this.apiCall(this.getServicesApiEndpoint('templates'), function (listTemplatesResponse) {
      if (listTemplatesResponse.errors) {
        this.set('errors', listTemplatesResponse.errors.map(function (err) {
          return err.message;
        }));
        return;
      }
      var removeTemplateRegex = /windows|centos 6/i;
      var templates = listTemplatesResponse.data.filter(function (template) {
        return !template.name.match(removeTemplateRegex);
      });

      let templateOpts = templates.map(function (template) {
        return {
          name: template.name,
          value: template.id,
          group: template.isPublic ? 'Standard' : 'User defined',
          resizable: template.resizable,
          maxSizeInGb: template.maxSizeInGb,
          stepSizeInGb: template.stepSizeInGb,
          sshUser: template.defaultUsername
        };
      }).sortBy('group', 'name');
      if (!this.config.template && templateOpts.length > 0) {
        this.set('model.cloudcaConfig.template', templateOpts[0].value);
      }

      this.set('templateOptions', templateOpts);
    }.bind(this));
  },

  apiCall: function (endpoint, callback) {
    let url = this.get('model.cloudcaConfig.apiUrl') + endpoint;
    let xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
      callback(JSON.parse(this.responseText));
    });
    xhr.open('get', url, true);
    xhr.setRequestHeader('MC-Api-Key', this.get('model.cloudcaConfig.apiKey'));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
  },

  getServicesApiEndpoint: function (entity) {
    return '/services/' + this.get('model.cloudcaConfig.serviceCode') + '/' + this.get('model.cloudcaConfig.environmentName') + '/' + entity;
  }

});

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
  driverName: '%%DRIVERNAME%%',
  config: alias('model.%%DRIVERNAME%%Config'),
  app: service(),

  init() {
    // This does on the fly template compiling, if you mess with this :cry:
    const decodedLayout = window.atob(LAYOUT);
    const template = Ember.HTMLBars.compile(decodedLayout, {
      moduleName: 'nodes/components/driver-%%DRIVERNAME%%/template'
    });
    set(this, 'layout', template);

    this._super(...arguments);

  },
  /*!!!!!!!!!!!DO NOT CHANGE END!!!!!!!!!!!*/

  // Write your component here, starting with setting 'model' to a machine with your config populated
  bootstrap: function () {
    // bootstrap is called by rancher ui on 'init', you're better off doing your setup here rather then the init function to ensure everything is setup correctly
    let config = get(this, 'globalStore').createRecord({
      type: '%%DRIVERNAME%%Config',
      cpuCount: 2,
      memorySize: 2048,
    });

    set(this, 'model.%%DRIVERNAME%%Config', config);
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

  firstPage: true,
  environmentsById: {},
  actions: {
    nextPage: function () {
      this.set('errors', []);
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

        this.environmentsById = envs.reduce(function (m, e) {
          m[e.id] = e;
          return m;
        }, {});

        this.set('environmentOptions', envs
          .map(function (env) {
            return {
              name: env.name,
              value: env.id,
              group: env.serviceConnection.serviceCode
            };
          }));
        if (this.get('environmentOptions').length > 0) {
          this.set('model.%%DRIVERNAME%%Config.environmentId', this.get('environmentOptions')[0].value);
        }
        this.set('firstPage', false);
      }.bind(this));
    }
  },

  environmentChange: function () {
    var env = this.environmentsById[this.get('model.%%DRIVERNAME%%Config.environmentId')];
    if (env) {
      this.set('model.%%DRIVERNAME%%Config.environmentName', env.name);
      this.set('model.%%DRIVERNAME%%Config.serviceCode', env.serviceConnection.serviceCode);

      this.updateNetworksOnEnvironmentChange();
      this.updateTemplatesOnEnvironmentChange();
    }
  }.observes('model.%%DRIVERNAME%%Config.environmentId'),

  updateNetworksOnEnvironmentChange: function () {
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
      if (this.get('networkOptions').length > 0) {
        this.set('model.%%DRIVERNAME%%Config.networkId', this.get('networkOptions')[0].value);
      }
    }.bind(this));
  },

  updateComputeOfferingsOnServiceCodeChange: function () {
    this.apiCall(this.getServicesApiEndpoint('computeofferings'), function (listComputeOfferingsResponse) {
      if (listComputeOfferingsResponse.errors) {
        this.set('errors', listComputeOfferingsResponse.errors.map(function (err) {
          return err.message;
        }));
        return;
      }
      var offerings = listComputeOfferingsResponse.data;
      this.set('computeOfferingOptions', offerings.map(function (offering) {
        return {
          name: offering.name,
          value: offering.id
        };
      }));
      if (this.get('computeOfferingOptions').length > 0) {
        this.set('model.%%DRIVERNAME%%Config.computeOffering', this.get('computeOfferingOptions')[0].value);
      }
    }.bind(this));
  }.observes('model.%%DRIVERNAME%%Config.serviceCode'),

  updateDiskOfferingsOnServiceCodeChange: function () {
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
          value: offering.id
        };
      });
      offeringOptions.push({
        name: "No additional disk",
        value: ""
      })
      this.set('diskOfferingOptions', offeringOptions);
      this.set('model.%%DRIVERNAME%%Config.diskOffering', this.get('diskOfferingOptions')[0].value);
    }.bind(this));
  }.observes('model.%%DRIVERNAME%%Config.serviceCode'),

  updateTemplatesOnEnvironmentChange: function () {
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

      this.set('templateOptions', templates.map(function (template) {
        return {
          name: template.name,
          value: template.id,
          group: template.isPublic ? 'Standard' : 'User defined',
          resizable: template.resizable,
          maxSizeInGb: template.maxSizeInGb,
          stepSizeInGb: template.stepSizeInGb
        };
      }).sortBy('group', 'name'));

      this.set('defaultUsernamesByTemplate', templates.reduce(function (m, t) {
        m[t.id] = t.defaultUsername;
        return m;
      }, {}));

      if (this.get('templateOptions').length > 0) {
        this.set('model.%%DRIVERNAME%%Config.template', this.get('templateOptions')[0].value);
      }
    }.bind(this));
  },

  updateSSHUserOnTemplateChange: function () {
    var defaultUsername = this.get('defaultUsernamesByTemplate')[this.get('model.%%DRIVERNAME%%Config.template')];
    if (defaultUsername) {
      this.set('model.%%DRIVERNAME%%Config.sshUser', defaultUsername);
    }
  }.observes('model.%%DRIVERNAME%%Config.template'),

  updateResizableOnTemplateChange: function () {
    var templateOptions = this.get('templateOptions');
    var selectedTemplateId = this.get("model.%%DRIVERNAME%%Config.template");
    var selectedTemplate = templateOptions.findBy('value', selectedTemplateId) || templateOptions[0];
    this.set('templateResizable', selectedTemplate.resizable);
    this.set('maxSizeInGb', selectedTemplate.maxSizeInGb);
    this.set('stepSizeInGb', selectedTemplate.stepSizeInGb);
    var templateSizeInGb = selectedTemplate.size / Math.pow(1024, 3);
    var stepSize = selectedTemplate.stepSizeInGb,
      aligned = templateSizeInGb % stepSize === 0,
      minSizeInGb = stepSize * (Math.floor(templateSizeInGb / stepSize) + (aligned ? 0 : 1));
    this.set('minSizeInGb', minSizeInGb);
    var currentSize = this.get('model.%%DRIVERNAME%%Config.rootDiskSizeInGb');
    if (currentSize < minSizeInGb) {
      this.set('model.%%DRIVERNAME%%Config.rootDiskSizeInGb', minSizeInGb);
    }
    this.rerender();
  }.observes('model.%%DRIVERNAME%%Config.template'),

  apiCall: function (endpoint, callback) {
    var url = this.get('model.%%DRIVERNAME%%Config.apiUrl') + endpoint,
      xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
      callback(JSON.parse(this.responseText));
    });
    xhr.open('get', url, true);
    xhr.setRequestHeader('MC-Api-Key', this.get('model.%%DRIVERNAME%%Config.apiKey'));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
  },

  getServicesApiEndpoint: function (entity) {
    return '/services/' + this.get('model.%%DRIVERNAME%%Config.serviceCode') + '/' + this.get('model.%%DRIVERNAME%%Config.environmentName') + '/' + entity;
  }
});

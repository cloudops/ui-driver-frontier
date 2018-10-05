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
      apiUrl : "https://api.cloud.ca/v1",
      usePrivateIp : true,
      sshUser: "cca-user",
    });
    set(this, 'model.cloudcaConfig', config);
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
  apiKeyPage: true,
  // envPage: false,
  // networkPage: false,
  // instancePage : false,
  // instancePage : false,
  pages : ['apiKeyPage','envPage','computePage', 'nodeTemplatePage'],
  environmentsById: {},
  setPage : function(pageNum) {
    this.set('errors', []);
    var self = this;
    this.pages.forEach((p,i) => {
      self.set(p, i === pageNum);
    });
  },
  actions: { 
    goToApiKeyPage: function(){
      this.setPage(0);
    },
    goToEnvsPage: function () {
      //check API key first
      this.setPage(1);
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
          var eId = this.get('model.cloudcaConfig.environmentId'); 
          var eId2= this.config.environmentId; 
          if (!eId && !eId2 && this.get('environmentOptions').length > 0) {
          this.set('model.cloudcaConfig.environmentId', this.get('environmentOptions')[0].value);
        } 
      }.bind(this));
    },
    goToComputePage: function () {
      this.setPage(2);
      var env = this.environmentsById[this.get('model.cloudcaConfig.environmentId')];
      if (env) {
        this.set('model.cloudcaConfig.environmentName', env.name);
        this.set('model.cloudcaConfig.serviceCode', env.serviceConnection.serviceCode);
        this.loadNetworks();
        this.loadTemplates();
        this.loadComputeOfferings();
        this.loadDiskOfferings();
      }
    },
    goToNodeTemplatePage: function(){
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
      if (!this.get('model.cloudcaConfig.networkId') && this.get('networkOptions').length > 0) {
        this.set('model.cloudcaConfig.networkId', this.get('networkOptions')[0].value);
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
      var offerings = listComputeOfferingsResponse.data;
      this.set('computeOfferingOptions', offerings.map(function (offering) {
        return {
          name: offering.name,
          value: offering.id
        };
      }));
      if (!this.get('model.cloudcaConfig.computeOffering') && this.get('computeOfferingOptions').length > 0) {
        this.set('model.cloudcaConfig.computeOffering', this.get('computeOfferingOptions')[0].value);
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
          value: offering.id
        };
      });
      offeringOptions.push({
        name: "No additional disk",
        value: ""
      })
      this.set('diskOfferingOptions', offeringOptions);
      if (!this.get('model.cloudcaConfig.diskOffering') && this.get('diskOfferingOptions').length > 0) {
        this.set('model.cloudcaConfig.diskOffering', this.get('diskOfferingOptions')[0].value);
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
        this.set('model.cloudcaConfig.template', this.get('templateOptions')[0].value);
      }
    }.bind(this));
  },

  apiCall: function (endpoint, callback) {
    var url = this.get('model.cloudcaConfig.apiUrl') + endpoint,
    xhr = new XMLHttpRequest();
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

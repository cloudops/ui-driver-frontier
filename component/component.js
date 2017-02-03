/* v----- Do not change anything between here
 *       (the DRIVERNAME placeholder will be automatically replaced during build) */
define('ui/components/machine/driver-%%DRIVERNAME%%/component', ['exports', 'ember', 'ui/mixins/driver'], function (exports, _ember, _uiMixinsDriver) {

  exports['default'] = _ember['default'].Component.extend(_uiMixinsDriver['default'], {
    driverName: '%%DRIVERNAME%%',
/* ^--- And here */

    // Write your component here, starting with setting 'model' to a machine with your config populated
    bootstrap: function () {
      let config = this.get('store').createRecord({
        type: '%%DRIVERNAME%%Config',
      });

      let type = 'host';
      if (!this.get('useHost')) {
        type = 'machine';
      }

      this.set('model', this.get('store').createRecord({
        type: type,
        '%%DRIVERNAME%%Config': config,
      }));
    },

    // Add custom validation beyond what can be done from the config API schema
    validate: function () {
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
            return env.serviceConnection.type === 'CloudCA';
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
      this.set('model.%%DRIVERNAME%%Config.environmentName', env.name);
      this.set('model.%%DRIVERNAME%%Config.serviceCode', env.serviceConnection.serviceCode);

      this.updateTiersOnEnvironmentChange();
      this.updateTemplatesOnEnvironmentChange();
    }.observes('model.%%DRIVERNAME%%Config.environmentId'),

    updateTiersOnEnvironmentChange: function () {
      this.apiCall(this.getServicesApiEndpoint('tiers'), function (listTiersResponse) {
        if (listTiersResponse.errors) {
          this.set('errors', listTiersResponse.errors.map(function (err) {
            return err.message;
          }));
          return;
        }
        var tiers = listTiersResponse.data;
        this.set('networkOptions', tiers.map(function (tier) {
            return {
               name: tier.name,
               value: tier.id,
               group: tier.vpcName
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
         offeringOptions.push({name:"No additional disk", value:""})
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
        var templates = listTemplatesResponse.data.filter(function(template) {
           return template.name.toLowerCase().indexOf('windows') == -1;
        });

        this.set('templateOptions', templates.map(function (template) {
            return {
               name: template.name,
               value: template.id,
               group: template.isPublic ? 'Standard':'User defined'
            };
         }).sortBy('group','name'));

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

   getServicesApiEndpoint: function(entity) {
         return '/services/' + this.get('model.%%DRIVERNAME%%Config.serviceCode') + '/' +  this.get('model.%%DRIVERNAME%%Config.environmentName') + '/' + entity;
   }
  });
});

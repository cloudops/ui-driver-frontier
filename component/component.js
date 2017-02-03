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
      // Get generic API validation errors
      this._super();
      var errors = this.get('errors') || [];

      // Add more specific errors

      // Check something and add an error entry if it fails:
      if (parseInt(this.get('model.%%DRIVERNAME%%Config.size'), 10) < 1024) {
        errors.push('Size must be at least 1024 MB');
      }

      // Set the array of errors for display,
      // and return true if saving should continue.
      this.set('errors', errors || []);
      return !errors.length;
    },

    firstPage: true,
    servicesByEnvironmentName: {},
    actions: {
      nextPage: function () {
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

          this.set('servicesByEnvironmentName', envs.reduce(function (m, e) {
            m[e.name] = e.serviceConnection.serviceCode;
            return m;
          }, {}));

          this.set('environmentOptions', envs
            .map(function (env) {
              return {
                name: env.serviceConnection.serviceCode + ' / ' + env.name,
                value: env.name
              };
            }));
          if (this.get('environmentOptions').length > 0) {
             this.set('model.%%DRIVERNAME%%Config.environmentName', this.get('environmentOptions')[0].value);
          }
          this.set('firstPage', false);
        }.bind(this));
      }
    },

    environmentChange: function () {
      var serviceCode = this.servicesByEnvironmentName[this.get('model.%%DRIVERNAME%%Config.environmentName')];
      this.set('model.%%DRIVERNAME%%Config.serviceCode', serviceCode);

      this.updateTiersOnEnvironmentChange();
      this.updateTemplatesOnEnvironmentChange();
    }.observes('model.%%DRIVERNAME%%Config.environmentName'),

    updateTiersOnEnvironmentChange: function () {
      this.apiCall('/services/' + this.get('model.%%DRIVERNAME%%Config.serviceCode') + '/' +  this.get('model.%%DRIVERNAME%%Config.environmentName') + '/tiers', function (listTiersResponse) {
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
      }.bind(this));
    },

    updateComputeOfferingsOnServiceCodeChange: function () {
      this.apiCall('/services/' + this.get('model.%%DRIVERNAME%%Config.serviceCode') + '/' +  this.get('model.%%DRIVERNAME%%Config.environmentName') + '/computeofferings', function (listComputeOfferingsResponse) {
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
      }.bind(this));
   }.observes('model.%%DRIVERNAME%%Config.serviceCode'),

    updateDiskOfferingsOnServiceCodeChange: function () {
      this.apiCall('/services/' + this.get('model.%%DRIVERNAME%%Config.serviceCode') + '/' +  this.get('model.%%DRIVERNAME%%Config.environmentName') + '/diskofferings', function (listDiskOfferingsResponse) {
        if (listDiskOfferingsResponse.errors) {
          this.set('errors', listDiskOfferingsResponse.errors.map(function (err) {
            return err.message;
          }));
          return;
        }
        var offerings = listDiskOfferingsResponse.data;
        this.set('diskOfferingOptions', offerings.map(function (offering) {
            return {
               name: offering.name,
               value: offering.id
            };
         }));
      }.bind(this));
    }.observes('model.%%DRIVERNAME%%Config.serviceCode'),

    updateTemplatesOnEnvironmentChange: function () {
      this.apiCall('/services/' + this.get('model.%%DRIVERNAME%%Config.serviceCode') + '/' +  this.get('model.%%DRIVERNAME%%Config.environmentName') + '/templates', function (listTemplatesResponse) {
        if (listTemplatesResponse.errors) {
          this.set('errors', listTemplatesResponse.errors.map(function (err) {
            return err.message;
          }));
          return;
        }
        var templates = listTemplatesResponse.data.filter(function(template) {
           return template.name.toLowerCase().indexOf('windows') == -1;
        }).sortBy('isPublic','name');

        this.set('templateOptions', templates.map(function (template) {
            return {
               name: template.name,
               value: template.id,
               group: template.isPublic ? 'Standard':'Environment'
            };
         }));

         this.set('defaultUsernamesByTemplate', templates.reduce(function (m, t) {
           m[t.id] = t.defaultUsername;
           return m;
         }, {}));
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
    }
  });
});

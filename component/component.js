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
                value: env.id
              };
            }));
          this.set('firstPage', false);
        }.bind(this));
      }
    },

    // TODO: make these computed properties? ie _ember.default.computed(...)
    networkOptions: _ember.default.computed('', function () {
      // TODO: return the networks in response to an env change (either using ember.computed or like environmentNameChanged below)
      return [{name: 'holy moly batman', value: 'asdfadf'}];
    }),
    templateOptions: [],
    environmentOptions: [],
    diskOfferingOptions: [],
    computeOfferingOptions: [],

    environmentNameChanged: function () {
      alert('adfasdf');
      var serviceCode = this.servicesByEnvironmentName[this.get('model.%%DRIVERNAME%%Config.environmentName')];
      this.set('model.%%DRIVERNAME%%Config.serviceCode', serviceCode);
    }.observes('model.%%DRIVERNAME%%Config.environmentName'),

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

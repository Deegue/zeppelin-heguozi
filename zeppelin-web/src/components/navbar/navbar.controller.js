/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

angular.module('zeppelinWebApp').controller('NavCtrl', NavCtrl);

function NavCtrl($scope, $rootScope, $http, $routeParams, $location,
                 noteListFactory, baseUrlSrv, websocketMsgSrv,
                 arrayOrderingSrv, searchService, TRASH_FOLDER_ID) {
  'ngInject';

  let vm = this;
  vm.arrayOrderingSrv = arrayOrderingSrv;
  vm.connected = websocketMsgSrv.isConnected();
  vm.isActive = isActive;
  vm.logout = logout;
  vm.notes = noteListFactory;
  vm.search = search;
  vm.searchForm = searchService;
  vm.showLoginWindow = showLoginWindow;
  vm.TRASH_FOLDER_ID = TRASH_FOLDER_ID;
  vm.isFilterNote = isFilterNote;
  vm.numberOfNotesDisplayed = 10;
  vm.toThriftServer01 = toThriftServer01;
  vm.toThriftServer02 = toThriftServer02;
  let thriftserver1 = 'application_1540866437371_314150';
  let thriftserver2 = 'application_1540866437371_314156';
  let interpreterSettings = [];
  let interpreterSettingsTmp;

  let revisionSupported = false;

  $scope.query = {q: ''};

  initController();
  initThriftServer();

  function getZeppelinVersion() {
    $http.get(baseUrlSrv.getRestApiBase() + '/version').success(
      function(data, status, headers, config) {
        // $rootScope.zeppelinVersion = data.body.version;
        $rootScope.zeppelinVersion = '0.8.1-2dfire-v03';
      }).error(
      function(data, status, headers, config) {
        console.log('Error %o %o', status, data.message);
      });
  }

  function initController() {
    $scope.isDrawNavbarNoteList = false;
    angular.element('#notebook-list').perfectScrollbar({suppressScrollX: true});

    angular.element(document).click(function() {
      $scope.query.q = '';
    });

    getZeppelinVersion();
    loadNotes();
  }

  function initThriftServer() {
    $http.get(baseUrlSrv.getRestApiBase() + '/interpreter/setting')
      .then(function(res) {
        interpreterSettings = res.data.body;
      }).catch(function(res) {
        if (res.status === 401) {
          alert('You don\'t have permission on this page');
        }
        console.log('Error %o %o', res.status, res.data ? res.data.message : '');
      });
  }

  function setSparkLog() {
    if (interpreterSettings !== undefined) {
      let index = _.findIndex(interpreterSettings, {'name': 'spark221'});
      if (index !== '-1') {
        interpreterSettingsTmp = angular.copy(interpreterSettings[index]);
        const obj = eval(interpreterSettingsTmp);
        thriftserver1 = obj.properties.spark_log01.value;
        thriftserver2 = obj.properties.spark_log02.value;
      }
    }
  }

  function toThriftServer01() {
    setTimeout(initThriftServer(), 1000);
    setSparkLog();
    window.location.href = 'http://cloudera.2dfire.net/hadoop1164-8088/proxy/' +
      thriftserver1 + '/jobs/';
  }

  function toThriftServer02() {
    setTimeout(initThriftServer(), 1000);
    setSparkLog();
    window.location.href = 'http://cloudera.2dfire.net/hadoop1164-8088/proxy/' +
      thriftserver2 + '/jobs/';
  }

  function isFilterNote(note) {
    if (!$scope.query.q) {
      return true;
    }

    let noteName = note.name;
    if (noteName.toLowerCase().indexOf($scope.query.q.toLowerCase()) > -1) {
      return true;
    }
    return false;
  }

  function isActive(noteId) {
    return ($routeParams.noteId === noteId);
  }

  function listConfigurations() {
    websocketMsgSrv.listConfigurations();
  }

  function loadNotes() {
    websocketMsgSrv.getNoteList();
  }

  function getHomeNote() {
    websocketMsgSrv.getHomeNote();
  }

  function logout() {
    let logoutURL = baseUrlSrv.getRestApiBase() + '/login/logout';

    $http.post(logoutURL).then(function() {}, function(response) {
      if (response.data) {
        let res = angular.fromJson(response.data).body;
        if (res['redirectURL']) {
          if (res['isLogoutAPI'] === 'true') {
            $http.get(res['redirectURL']).then(function() {
            }, function() {
              window.location = baseUrlSrv.getBase();
            });
          } else {
            window.location.href = res['redirectURL'] + window.location.href;
          }
          return undefined;
        }
      }

      // force authcBasic (if configured) to logout
      if (detectIE()) {
        let outcome;
        try {
          outcome = document.execCommand('ClearAuthenticationCache');
        } catch (e) {
          console.log(e);
        }
        if (!outcome) {
          // Let's create an xmlhttp object
          outcome = (function(x) {
            if (x) {
              // the reason we use "random" value for password is
              // that browsers cache requests. changing
              // password effectively behaves like cache-busing.
              x.open('HEAD', location.href, true, 'logout',
                (new Date()).getTime().toString());
              x.send('');
              // x.abort()
              return 1; // this is **speculative** "We are done."
            } else {
              // eslint-disable-next-line no-useless-return
              return;
            }
          })(window.XMLHttpRequest ? new window.XMLHttpRequest()
            // eslint-disable-next-line no-undef
            : (window.ActiveXObject ? new ActiveXObject('Microsoft.XMLHTTP') : u));
        }
        if (!outcome) {
          let m = 'Your browser is too old or too weird to support log out functionality. Close all windows and ' +
            'restart the browser.';
          alert(m);
        }
      } else {
        // for firefox and safari
        logoutURL = logoutURL.replace('//', '//false:false@');
      }

      $http.post(logoutURL).error(function() {
        $rootScope.userName = '';
        $rootScope.ticket.principal = '';
        $rootScope.ticket.screenUsername = '';
        $rootScope.ticket.ticket = '';
        $rootScope.ticket.roles = '';
        BootstrapDialog.show({
          message: 'Logout Success',
        });
        setTimeout(function() {
          window.location = baseUrlSrv.getBase();
        }, 1000);
      });
    });
  }

  function detectIE() {
    let ua = window.navigator.userAgent;

    let msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    let trident = ua.indexOf('Trident/');
    if (trident > 0) {
      // IE 11 => return version number
      let rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    let edge = ua.indexOf('Edge/');
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
  }

  function search(searchTerm) {
    $location.path('/search/' + searchTerm);
  }

  function showLoginWindow() {
    setTimeout(function() {
      angular.element('#userName').focus();
    }, 500);
  }

  /*
   ** $scope.$on functions below
   */

  $scope.$on('setNoteMenu', function(event, notes) {
    noteListFactory.setNotes(notes);
    initNotebookListEventListener();
  });

  $scope.$on('setConnectedStatus', function(event, param) {
    vm.connected = param;
  });

  $scope.$on('loginSuccess', function(event, param) {
    $rootScope.ticket.screenUsername = $rootScope.ticket.principal;
    listConfigurations();
    loadNotes();
    getHomeNote();
  });

  /*
   ** Performance optimization for Browser Render.
   */
  function initNotebookListEventListener() {
    angular.element(document).ready(function() {
      angular.element('.notebook-list-dropdown').on('show.bs.dropdown', function() {
        $scope.isDrawNavbarNoteList = true;
      });

      angular.element('.notebook-list-dropdown').on('hide.bs.dropdown', function() {
        $scope.isDrawNavbarNoteList = false;
      });
    });
  }

  $scope.loadMoreNotes = function() {
    vm.numberOfNotesDisplayed += 10;
  };

  $scope.calculateTooltipPlacement = function(note) {
    if (note !== undefined && note.name !== undefined) {
      let length = note.name.length;
      if (length < 2) {
        return 'top-left';
      } else if (length > 7) {
        return 'top-right';
      }
    }
    return 'top';
  };

  $scope.$on('configurationsInfo', function(scope, event) {
    // Server send this parameter is String
    if(event.configurations['isRevisionSupported']==='true') {
      revisionSupported = true;
    }
  });

  $rootScope.isRevisionSupported = function() {
    return revisionSupported;
  };
}

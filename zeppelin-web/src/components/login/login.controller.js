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

angular.module('zeppelinWebApp').controller('LoginCtrl', LoginCtrl);

function LoginCtrl($scope, $rootScope, $http, $httpParamSerializer, baseUrlSrv, $location, $timeout) {
  'ngInject';

  $scope.SigningIn = false;
  $scope.loginParams = {};
  $scope.login = function() {
    $scope.SigningIn = true;
    $http({
      method: 'POST',
      url: baseUrlSrv.getRestApiBase() + '/login',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: $httpParamSerializer({
        'userName': $scope.loginParams.userName,
        'password': $scope.loginParams.password,
      }),
    }).then(function successCallback(response) {
      $rootScope.ticket = response.data.body;
      angular.element('#loginModal').modal('toggle');
      $rootScope.$broadcast('loginSuccess', true);
      $rootScope.userName = $scope.loginParams.userName;
      $scope.SigningIn = false;

      // redirect to the page from where the user originally was
      if ($location.search() && $location.search()['ref']) {
        $timeout(function() {
          let redirectLocation = $location.search()['ref'];
          $location.$$search = {};
          $location.path(redirectLocation);
        }, 100);
      }
    }, function errorCallback(errorResponse) {
      $scope.loginParams.errorText = 'The username and password that you entered don\'t match.';
      $scope.SigningIn = false;
    });
  };

  let getQueryString = function(name) {
    const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
    const r = window.location.search.substr(1).match(reg);
    if (r !== null) {
      return r[2];
    }
    return '';
  };

  $rootScope.login = function() {
    // alert('login entry 2018-09-25');
    let code = getQueryString('code');
    // alert('code:' + code);
    let idToken = '';
    $http({
      method: 'post',
      url: 'http://argus-api.pre.2dfire.net/login/token',
      headers: {
        'X-token': 'Zeppelin',
      },
      data: {
        client_id: 'de79d64f3ac21301',
        client_secret: 'bd7aad074b76cdca2Kbh_IGfHDucl9ekuPAV_l7DhBk',
        grant_type: 'authorization_code',
        redirect_uri: 'http://zp.2dfire.net/',
        code: code,
      },
    }).success(function(data) {
      if (data.data.success === 'true') {
        idToken = data.data.token;
        // alert('获取id_token成功 :\n' + idToken);
        // 将最终返回的idToken传到后端，后端通过对应的部门 从库中获取相应权限的用户名及密码并返回给前端
        let username = null;
        let password = null;
        $http({
          method: 'post',
          url: 'http://argus-api.pre.2dfire.net/rule/decodeRoles',
          headers: {
            'X-token': 'Zeppelin',
          },
          params: {
            token: idToken,
          },
        }).success(function(data) {
          // alert('post2 success');
          if (data.data === '-1') {
            alert('部门账号未添加或其他异常！');
            return;
          } else {
            username = data.data.split(',')[0];
            password = data.data.split(',')[1];
            if (username === null || password === null) {
              alert('获取统一登录映射用户异常');
              return;
            }
            // alert('获取用户名:' + username + ',密码:' + password + ' 成功');
            $scope.SigningIn = true;
            $http({
              method: 'POST',
              url: baseUrlSrv.getRestApiBase() + '/login',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              data: $httpParamSerializer({
                'userName': username,
                'password': password,
              }),
            }).then(function successCallback(response) {
              $rootScope.ticket = response.data.body;
              angular.element('#loginModal').modal('toggle');
              $rootScope.$broadcast('loginSuccess', true);
              $rootScope.userName = username;
              $scope.SigningIn = false;
              // redirect to the page from where the user originally was
              if ($location.search() && $location.search()['ref']) {
                $timeout(function() {
                  let redirectLocation = $location.search()['ref'];
                  $location.$$search = {};
                  $location.path(redirectLocation);
                }, 100);
              }
            }, function errorCallback(errorResponse) {
              $scope.loginParams.errorText = 'The username and password that you entered don\'t match.';
              $scope.SigningIn = false;
            });
          }
        }).error(function(err) {
          alert('当前请求过多，请稍后再试~');
          return;
        });
      } else {
        alert('统一登录失败了，请将网页地址改成\nhttp://zp.2dfire.net/\n以重试统一登录');
      }
    }).error(function(err) {
      alert('当数请求过多，请稍后再试~');
    });
  };

  let initValues = function() {
    $scope.loginParams = {
      userName: '',
      password: '',
    };
  };

  // handle session logout message received from WebSocket
  $rootScope.$on('session_logout', function(event, data) {
    if ($rootScope.userName !== '') {
      $rootScope.userName = '';
      $rootScope.ticket = undefined;

      setTimeout(function() {
        $scope.loginParams = {};
        $scope.loginParams.errorText = data.info;
        angular.element('.nav-login-btn').click();
      }, 1000);
      let locationPath = $location.path();
      $location.path('/').search('ref', locationPath);
    }
  });

  /*
   ** $scope.$on functions below
   */
  $scope.$on('initLoginValues', function() {
    initValues();
  });
}

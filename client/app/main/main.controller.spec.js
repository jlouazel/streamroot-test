'use strict';

describe('Controller: MainCtrl', function () {

  // load the service's module
  beforeEach(module('streamrootTestApp'));
  beforeEach(module('socketMock'));

  beforeEach(inject(function ($http, $controller, $rootScope, scope) {

    scope = $rootScope.$new();
    MainCtrl = $controller('MainCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of things to the scope', function () {
    $http.flush();
    expect(scope.users.length).toBe(4);
  });
});

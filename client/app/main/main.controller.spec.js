'use strict';

'use strict';

describe('Controller: MainCtrl', function () {

  // load the service's module
  beforeEach(module('streamrootTestApp'));
  beforeEach(module('socketMock'));

  var MainCtrl,
  scope,
  $httpBackend;

  // Initialize the controller and a mock scope
  // beforeEach(inject(function (_$httpBackend_, $controller, $rootScope) {
  //   $httpBackend = _$httpBackend_;
  //   $httpBackend.expectGET('/api/users')
  //   .respond(['HTML5 Boilerplate', 'AngularJS', 'Karma', 'Express']);
  //
  //   scope = $rootScope.$new();
  //   MainCtrl = $controller('MainCtrl', {
  //     $scope: scope
  //   });
  // }));
  //
  // it('should attach a list of things to the scope', function () {
  //   $httpBackend.flush();
  //   expect(scope.awesomeThings.length).toBe(4);
  // });

});

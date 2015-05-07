'use strict';

describe('Service: Communication', function () {

  // load the service's module
  beforeEach(module('streamrootTestApp'));

  // instantiate service
  var communication;
  beforeEach(inject(function (Communication) {
    communication = Communication;
  }));

  it('should do something', function () {
    expect(!!communication).toBe(true);
  });

});

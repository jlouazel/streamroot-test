/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../api/user/user.model');

User.find({}).remove(function() {
  User.create({
    provider: 'local',
    name: 'Jean-Baptiste Louazel',
    email: 'jb.louazel@gmail.com',
    password: 'admin'
  },
  {
    provider: 'local',
    name: 'Julien Polge',
    email: 'julien.polge@gmail.com',
    password: 'test'
  }, {
    provider: 'local',
    name: 'Alexandre Déceneux',
    email: 'alexandre.deceneux@gmail.com',
    password: 'test'
  }, function() {
      console.log('finished populating users');
    }
  );
});

'use strict';

var prompt = require('prompt');
var _ = require('lodash');
var login = require('./login');
var transfer = require('./transfer');
var player = require('./player');

prompt.start();

let promptSchema = [
    {
        'name': 'username',
        'required': true
    },
    {
        'name': 'password',
        'hidden': true,
        'required': true
    },
    {
        'description': 'Minimum value for keeping a player',
        'name': 'minValue',
        'type': 'number',
        'required': true,
        'default': 30
    }
];

prompt.get(promptSchema, function (err, promptResult) {
    login(promptResult.username, promptResult.password)
        .then(function () {
            return transfer();
        })
        .then(function (playerIds) {
            return player(playerIds, promptResult.minValue);
        })
        .then(function (players) {
            console.log(`\n${ players.length } player(s) found:`);
            _.each(players, player => console.log(`Player name: ${ player.name }, URL: ${ player.url }`));
        });
});
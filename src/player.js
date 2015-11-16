'use strict';

var q = require('q');
var http = require('q-io/http');
var cheerio = require('cheerio');
var _ = require('lodash');
var ProgressBar = require('progress');
var cookie = require('./cookie');

/**
 * Requests the specified player page.
 * @method
 * @param {number} playerId
 * @private
 * @return {Promise}
 */
function _getPlayerPage(playerId) {
    let options = {
        'url': `http://www.virtuafoot.com/joueur.php?jid=${ playerId }&_lang=fr`,
        'method': 'GET',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookie.getCookies()
        }
    };

    return http.request(options);
}

/**
 * Returns the player statistics.
 * @method
 * @private
 * @param {string} html
 * @param {number} playerId
 * @return {{id: number, name: string, statistics: Object}}
 */
function _getPlayerStatistics(html, playerId) {
    let $ = cheerio.load(html);
    let $tables = $('table.ca');
    let player = {
        'id': playerId,
        'name': $tables.eq(0).find('td').eq(1).text(),
        'url': `http://www.virtuafoot.com/#!joueur?jid=${ playerId }`,
        'statistics': {}
    };

    $tables.eq(2).find('tr').each(function (index, row) {
        let $cells = $(row).find('td');
        player.statistics[$cells.eq(0).text()] = $cells.eq(1).text();
    });

    return player;
}

/**
 * Fetches all the player statistics.
 * @method
 * @private
 * @param {number[]} playerIds
 * @return {Promise}
 */
function _getPlayersStatistics(playerIds) {
    let promises = [];
    let timeoutPromises = [];

    let progressBar = new ProgressBar('[:bar] :percent', {
        'width': 30,
        'total': playerIds.length
    });

    playerIds.forEach(function (playerId, i) {
        let deferred = q.defer();

        setTimeout(function () {
            promises.push(_getPlayerPage(playerId));
            progressBar.tick();
            deferred.resolve();
        }, i * 100);

        timeoutPromises.push(deferred.promise);
    });

    return q.all(timeoutPromises).then(function () {
        return q.all(promises);
    });
}

/**
 * Filters the players by removing those whose statistics are below the specified minimum value.
 * @method
 * @private
 * @param {Object[]} players
 * @param {number} minValue
 * @return {Array}
 */
function _filterPlayers(players, minValue) {
    return _.filter(players, player => _.some(player.statistics, value => value >= minValue));
}

/**
 * Returns the players whose statistics are above the specified minimum value.
 * @method
 * @param {number[]} playerIds
 * @param {number} minValue
 * @return {Promise}
 */
module.exports = function (playerIds, minValue) {
    return _getPlayersStatistics(playerIds)
        .then(function () {
            let args = [];
            for (let i = 0; i < arguments.length; ++i) {
                args.push(arguments[i]);
            }
            let promises = [];
            args[0].forEach(response => promises.push(response.body.read()));
            return q.all(promises);
        })
        .then(function () {
            let args = [];
            for (let i = 0; i < arguments.length; ++i) {
                args.push(arguments[i]);
            }
            let bodies = args[0].map(body => body.toString());
            return bodies.map((html, i) => _getPlayerStatistics(html, playerIds[i]));
        })
        .then(function (players) {
            return _filterPlayers(players, minValue);
        })
        .catch(function (error) {
            console.log(error);
            console.error(`Error when trying to retrieve the players: ${ playerIds }`);
        });
};
'use strict';

var http = require('q-io/http');
var q = require('q');
var cheerio = require('cheerio');
var cookie = require('./cookie');

var PLAYER_ID_REGEX = /#!joueur\?jid=(\d+)/;

/**
 * Returns all the transfer pages.
 * @method
 * @private
 * @return {Promise}
 */
function _getTransferPages() {
    let options = {
        'url': `http://www.virtuafoot.com/transferts.php?free&_lang=fr`,
        'method': 'GET',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookie.getCookies()
        }
    };

    return http.request(options).then(function (response) {
        return response.body.read();
    }).then(function (body) {
        let $ = cheerio.load(body.toString());
        let pageCount = $('a', '.pagination').last().text();
        let promises = [];

        for (let pageNumber = 1; pageNumber <= pageCount; ++pageNumber) {
            promises.push(_getTransferPage(pageNumber));
        }

        return q.all(promises);
    });
}

/**
 * Returns the transfer page specified by its number.
 * @method
 * @private
 * @param {number} pageNumber
 * @return {Promise}
 */
function _getTransferPage(pageNumber) {
    let options = {
        'url': `http://www.virtuafoot.com/transferts.php?free&_lang=fr&page=${ pageNumber }`,
        'method': 'GET',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookie.getCookies()
        }
    };

    return http.request(options).then(function (response) {
        return response.body.read();
    });
}

/**
 * Parses the page and returns all player links.
 * @method
 * @private
 * @param {string} html
 * @return {string[]}
 */
function _getPlayerLinks(html) {
    let $ = cheerio.load(html);
    let links = [];
    $('a').map((index, a) => links.push($(a).attr('href')));
    return links
        .filter(link => PLAYER_ID_REGEX.test(link))
        .map(link => PLAYER_ID_REGEX.exec(link)[1]);
}

/**
 * Returns the all player links.
 * @method
 * @return {Promise}
 */
module.exports = function () {
    return _getTransferPages()
        .then(function (pages) {
            let links = [];
            pages.forEach(page => links = links.concat(_getPlayerLinks(page.toString())));
            return links;
        })
        .catch(function (error) {
            console.log(error);
            console.error(`Error when trying to retrieve the transfers: ${ error }`);
        });
};
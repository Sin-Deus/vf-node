'use strict';

var http = require('q-io/http');
var cookie = require('./cookie');

/**
 * Logs the user in the web application, and stores the session cookies via the cookie module.
 * @method
 * @param {string} username
 * @param {string} password
 * @private
 * @return {Promise}
 */
function _login(username, password) {
    let data = `login=${ username }&password=${ password }`;

    let options = {
        'url': 'http://www.virtuafoot.com/login.php',
        'method': 'POST',
        'body': [data],
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data, 'utf-8')
        }
    };

    return http.request(options);
}

/**
 * Logs the user in the web application.
 * @method
 * @param {string} username
 * @param {string} password
 * @return {Promise}
 */
module.exports = function (username, password) {
    return _login(username, password)
        .then(function (response) {
            cookie.storeCookies(response);
        })
        .catch(function (error) {
            console.log(error);
            console.error(`Error when trying to log in with credentials "${ username } ": ${ error }`);
        });
};
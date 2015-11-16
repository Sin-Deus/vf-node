'use strict';

var _COOKIES = [];

module.exports = {
    /**
     * Stores the response cookies.
     * @method
     * @param {Object} response
     * @param {Array} response.headers
     */
    'storeCookies': function (response) {
        response.headers['set-cookie'].forEach(function (cookie) {
            _COOKIES.push(cookie.substr(0, cookie.indexOf(';')));
        });
    },

    /**
     * Returns the stored cookies, in a HTTP-header-formatted way.
     * @method
     * @return {string}
     */
    'getCookies': function () {
        return _COOKIES.join('; ');
    }
};
"use strict";

import prepare from "../access/prepare";

/**
 * Checks if service exist, else add it
 *
 * @param {String} type The type of the service (service/factory)
 * @param {Function} cf The Constructor function of the service
 * @param {String} name The name to register/id the service
 * @param {Array} deps List of dependencies
 * @param {Function} fn Content of the service
 * @returns {Object} Returns `this`
 */
export default function (type, cf, name, deps, fn) {
    const _this = this;
    const entry = {
        type, //Type of the module
        name, //Name of the module
        deps, //Array of dependencies
        fn, //Module content function
        rdy: false, //If the module is ready to access
        init: function () { //init the module
            return prepare.call(_this, entry, cf);
        }
    };

    //Saves entry to chev container
    _this.chev.set(name, entry);

    return _this;
}

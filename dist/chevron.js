/*
chevronjs v0.3.0

Copyright (c) 2016 Felix Rilling

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

"use strict";

(function(window) {

    class Chevron {
        constructor() {
                let _this = this;
                _this.container = {};

                //All chevron related methods
                _this.cv = {
                    //Returns if Array of dependencies exists
                    load: function(dependencies, done, error) {
                        let result = true;

                        _this.util.each(dependencies, dependency => {
                            if (!_this.cv.exists(dependency)) {
                                error(dependency);
                                result = false;
                            }
                        });
                        if (result) {
                            done();
                        }

                        return result;
                    },
                    //Bundle dependencies from Array to object
                    bundle(dependencies) {
                        let result = {};

                        _this.util.each(dependencies, dependency => {
                            result[dependency] = _this.container[dependency].content;
                        });

                        return result;
                    },
                    //returns if dependency exists
                    exists(dependency) {
                        return _this.util.isDefined(_this.container[dependency]);
                    },
                    //returns Array of dependencies
                    list() {
                        return _this.container;
                    }

                };
                //All generic methods
                _this.util = {
                    each: function(arr, fn) {
                        for (let i = 0, l = arr.length; i < l; i++) {
                            fn(arr[i], i);
                        }
                    },
                    isDefined: function(val) {
                        return typeof val !== "undefined";
                    },
                    log(name, type, msg) {
                        let str = `Chevron ${type} in service ${name}: ${msg}`;
                        if (type === "error") {
                            throw str;
                        } else {
                            console.log(str);
                        }
                    }
                };

            }
            //Core Provider method
        provider(name, dependencies, content, finish) {
                let _this = this;

                _this.cv.load(dependencies, () => {
                    if (!_this.cv.exists(name)) {
                        finish(name);
                    } else {
                        _this.util.log(name, "error", `service '${name}' already declared`);
                    }
                }, missing => {
                    _this.util.log(name, "error", `dependency '${missing}' not found`);
                });
            }
            //accepts all data
        service(name, dependencies, content) {
                let _this = this;

                return _this.provider(name, dependencies, content,
                    () => {
                        _this.container[name] = {
                            dependencies,
                            type: typeof content,
                            content
                        };
                    });
            }
            //accepts constructor function
        factory(name, dependencies, Class, args) {
                let _this = this;
                args.unshift(null);

                return _this.provider(name, dependencies, Class,
                    () => {
                        _this.container[name] = {
                            dependencies,
                            type: "object",
                            content: new(Function.prototype.bind.apply(Class, args))
                        };
                    });
            }
            //Lets you access services with their dependencies injected
        access(name) {
            let _this = this,
                result,
                service = _this.container[name];

            if (service.type === "function") {
                result = service.content.bind(
                    _this.cv.bundle(service.dependencies)
                );
            } else {
                result = service.content;
            }

            return result;
        }
    }

    window.Chevron = Chevron;
})(window);

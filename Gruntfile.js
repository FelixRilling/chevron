"use strict";

module.exports = function (grunt) {
    require("time-grunt")(grunt);
    require("jit-grunt")(grunt, {});

    grunt.initConfig({
        watch: {
            js: {
                files: [
                    "src/{,*/}*.js"
                ],
                tasks: [
                    "exec"
                ]
            },
        },

        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        "dist/{,*/}*",
                        ".tmp/{,*/}*"
                    ]
                }]
            }
        },

        uglify: {
            main: {
                files: {
                    "dist/chevron.min.js": "dist/chevron.js",
                    //"dist/chevron-lite-es5.min.js": ".tmp/chevron-lite-es5.js"
                },
                options: {
                    compress: {
                        drop_console: true,
                        screw_ie8: true
                    }
                }
            }
        },

        babel: {
            options: {
                sourceMap: true,
                presets: ["es2015"],
                plugins: ["array-includes"]
            },
            dist: {
                files: {
                    "dist/chevron.js": "dist/chevron.js",
                    //".tmp/chevron-lite-es5.js": ".tmp/chevron-lite.js"
                }
            }
        },

        exec: {
            rollup: {
                cmd: "rollup -c"
            }
        },
        replace: {
            dist: {
                options: {
                    patterns: [
                        //Error strings
                        {
                            match: /_service/g,
                            replacement: "s"
                        }, {
                            match: /_factory/g,
                            replacement: "f"
                        }, {
                            match: /_error/g,
                            replacement: "e"
                        },
                        //Container strings
                        {
                            match: /_name/g,
                            replacement: "n"
                        }, {
                            match: /_type/g,
                            replacement: "t"
                        }, {
                            match: /_deps/g,
                            replacement: "d"
                        }, {
                            match: /_fn/g,
                            replacement: "f"
                        }, {
                            match: /_init/g,
                            replacement: "i"
                        }, {
                            match: /_args/g,
                            replacement: "a"
                        }
                    ]
                },
                files: [{
                    expand: true,
                    flatten: true,
                    src: ["dist/*.js"],
                    dest: "dist/"
                }]
            }
        }

    });

    grunt.registerTask("build", [
        "clean:dist",
        "exec",
    ]);

    grunt.registerTask("dist", [
        "build",
        "babel",
        "replace",
        "uglify",
    ]);

    grunt.registerTask("default", [
        "dist"
    ]);

};

(function () {
    "use strict";

    var gulp = require('gulp');
    var concat = require('gulp-concat');
    var zip = require('gulp-zip');
    var plumber = require('gulp-plumber');
    var wrapper = require('gulp-wrapper');

    var config = {
        common: ['./src/libs/*.js'],
        inline: ['./src/inline/*.js'],
        content: ['./src/content/*.js'],
        vendors: [
            'node_modules/jquery/dist/jquery.min.js'
        ]
    };

    gulp.task('js', ['content.js', 'inline.js', 'vendors.js']);

    gulp.task('content.js', function () {
        return jsRoutine(config.common.concat(config.content), 'content.js');
    });

    gulp.task('inline.js', function () {
        return jsRoutine(config.vendors.concat(config.common, config.inline), 'inline.js');
    });

    gulp.task('vendors.js', function(){
        return jsRoutine([
            'node_modules/eev/eev.min.js',
            'node_modules/jquery/dist/jquery.min.js'
        ], 'vendors.js');
    });

    gulp.task('watch', ['js'], function () {
        gulp.watch(['./src/**/*.js'], ['js']);
    });

    gulp.task('build', ['js'], function(){
        return gulp.src('extension/**/*')
            .pipe(zip('extension.zip'))
            .pipe(gulp.dest('./build'));
    });

    gulp.task("default", ["watch"]);

    function jsRoutine(src, name) {
        return gulp.src(src)
            .pipe(plumber({
                handleError: function (err) {
                    console.log(err);
                    this.emit('end');
                }
            }))
            .pipe(concat(name))
            .pipe(wrapper({
                header: '(function(){\n"use strict";\n',
                footer: '}.bind(window)());\n'
            }))
            .pipe(gulp.dest('./extension/build'));
    }
}());
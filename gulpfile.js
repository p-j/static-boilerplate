'use strict';

var _        = require('lodash'),
fs           = require('fs'),
glob         = require('glob'),
gulp         = require('gulp'),
sass         = require('gulp-ruby-sass'),
autoprefixer = require('gulp-autoprefixer'),
minifycss    = require('gulp-minify-css'),
jshint       = require('gulp-jshint'),
uglify       = require('gulp-uglify'),
imagemin     = require('gulp-imagemin'),
rename       = require('gulp-rename'),
clean        = require('gulp-clean'),
concat       = require('gulp-concat'),
cache        = require('gulp-cache'),
connect      = require('gulp-connect'),
uncss        = require('gulp-uncss'),
size         = require('gulp-size'),
newer        = require('gulp-newer');

var config = {
	src: 'src',   // source directory
	dist: 'dist', // destination directory
	port: 9013,   // webserver port
	lr: {
		port: 35731 // livereload port
	}
};

// **** Prepare Bower's assets ****
// It is needed if you want to choose which JS components to load and to
// maintain the correct order since some components may depend on others.
var bower = {
	fonts: [
		'bootstrap-sass/vendor/assets/fonts/bootstrap/*',
		'font-awesome/fonts/*'
	],
	scripts: [
		'jquery/dist/jquery.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/affix.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/alert.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/button.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/carousel.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/collapse.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/dropdown.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/tab.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/transition.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/scrollspy.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/modal.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/tooltip.js',
		'bootstrap-sass/vendor/assets/javascripts/bootstrap/popover.js',
		'modernizr/modernizr.js'
	]
};

// Simple utility function to read JSONish file (require fail on .bowerrc)
var readJSONFromFile = function(path) {
	return JSON.parse(fs.readFileSync(path, 'utf8'));
}

var bower_config = readJSONFromFile(__dirname + '/.bowerrc');
// Update path with the bower configurated path
_.each(bower, function (cat, key) {
	bower[key] = _.map(cat, function (path) {
		return bower_config.directory + '/' + path;
	});
});

// Connect & LiveReload server
gulp.task('connect', connect.server({
	root: [__dirname + '/' + config.dist],
	port: config.port,
	livereload: {
		port: config.lr.port
	},
	open: {
		file: 'index.html'
	}
}));

// Styles
gulp.task('styles', function () {
	return gulp.src('src/styles/main.scss')
		.pipe(newer('dist/assets/css', '.css'))
		.pipe(sass({
			style: 'expanded',
			sourcemap: true,
			precision: 10,
			loadPath: [bower_config.directory],
			compass: true
		}))
		.pipe(autoprefixer('last 3 version'))
		.pipe(gulp.dest('dist/assets/css'))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(uncss({
			html: glob.sync('src/html/**/*.html')
		}))
		.pipe(minifycss())
		.pipe(connect.reload())
		.pipe(gulp.dest('dist/assets/css'))
		.pipe(size());
});

// Fonts
gulp.task('fonts', function () {
	return gulp.src(bower.fonts)
		.pipe(newer('dist/assets/fonts'))
		.pipe(connect.reload())
		.pipe(gulp.dest('dist/assets/fonts'));
});

// Scripts
gulp.task('scripts', function () {
	return gulp.src(_.flatten([bower.scripts, 'src/scripts/**/*.js']))
		.pipe(newer('dist/assets/js', '.js'))
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(concat('main.js'))
		.pipe(gulp.dest('dist/assets/js'))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(uglify())
		.pipe(connect.reload())
		.pipe(gulp.dest('dist/assets/js'))
		.pipe(size());
});

// Images
gulp.task('images', function () {
	return gulp.src('src/images/**/*')
		.pipe(newer('dist/assets/img'))
		.pipe(cache(imagemin({
			optimizationLevel: 5,
			progressive: true,
			interlaced: true
		})))
		.pipe(connect.reload())
		.pipe(gulp.dest('dist/assets/img'))
		.pipe(size());;
});

// HTML
gulp.task('html', function () {
	return gulp.src('src/html/**/*.html')
		.pipe(newer('dist', '.html'))
		.pipe(connect.reload())
		.pipe(gulp.dest('dist'));
});

// Copy
gulp.task('copy', function () {
	return gulp.src([
		'src/humans.txt',
		'src/robots.txt'
	])
		.pipe(gulp.dest('dist'));
});

// Clean
gulp.task('clean', function () {
	return gulp.src(['dist/assets'], {
		read: false
	})
		.pipe(clean());
});

// Default task
gulp.task('default', ['build'], function () {
	gulp.start('connect', 'watch');
});

// Build task
gulp.task('build', ['clean'], function () {
	gulp.start('styles', 'scripts', 'fonts', 'images', 'html', 'copy');
});

// Watch
gulp.task('watch', function () {
	// gulp.watch('<pattern>', [tasks]);
	gulp.watch('src/styles/**/*.scss', ['styles']);
	gulp.watch('src/scripts/**/*.js', ['scripts']);
	gulp.watch('src/images/**/*', ['images']);
	gulp.watch('src/html/**/*.html', ['html']);
});

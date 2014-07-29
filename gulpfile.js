'use strict';

var _        = require('lodash'),
fs           = require('fs'),
path         = require('path'),
glob         = require('glob'),
gulp         = require('gulp'),
// sass         = require('gulp-ruby-sass'),    // uses Ruby compiler
sass         = require('gulp-sass'),         // uses C compiler (libsass via node-sass)
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
filter       = require('gulp-filter'),
gutil        = require('gulp-util'),
yaml         = require('js-yaml'),
newer        = require('gulp-newer');

// Simple utility function to read JSONish file (require fail on .bowerrc)
var readJSONFile = function(path) {
	return JSON.parse(fs.readFileSync(path, 'utf8'));
};

// Simple utility function to read YAML file synchroneously
var readYAMLFile = function(path) {
	return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
};

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
// You should customize this to your needs.
// Path are relative to bower's install folder, usually src/bower_components/
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

// This reads the bowerrc file to get the correct directory
var bowerConfig = readJSONFile(__dirname + '/.bowerrc');
// Update path with the configurated path
_.each(bower, function (cat, key) {
	bower[key] = _.map(cat, function (filepath) {
		return bowerConfig.directory + path.sep + filepath;
	});
});

// Connect & LiveReload server
gulp.task('connect', connect.server({
	root: [__dirname + path.sep + config.dist],
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

		// gulp-ruby-sass config
		// .pipe(sass({
		// 	style: 'expanded',
		// 	sourcemap: true,
		// 	precision: 10,
		// 	loadPath: [bowerConfig.directory],
		// 	compass: true
		// }))

		// gulp-sass config
		.pipe(sass({
			outputStyle: 'expanded',
			precision: 10,
			sourceComments: 'none',
			// sourceMap: 'sass',
			includePaths: [bowerConfig.directory],
			imagePath: 'src/images'
		}))

		// removed unused CSS
		.pipe(uncss({
			html: glob.sync('src/html/**/*.html'),
			ignore: [ // Keep some JS dependent CSS from being deleted,
			          // these are examples, you should configure as needed
				'.in',
				'.collapse',
				'.collapse.in',
				'.collapsing',
				'.collapsed',
				'.navbar-collapse',
				'.navbar-collapse.in',
				'.navbar-collapse.collapse'
			]
		}))
		.pipe(autoprefixer('last 3 version'))
		.pipe(gulp.dest('dist/assets/css'))
		.pipe(rename({
			suffix: '.min'
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
	// Filters IE specific JS that will be loaded via conditional comments
	var filterIESpecific = filter(['*', '!**/ie/**.js']);
	return gulp.src(_.flatten([bower.scripts, 'src/scripts/**/*.js']))
		.pipe(newer('dist/assets/js', '.js'))
		.pipe(filterIESpecific)
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(concat('main.js'))
		.pipe(filterIESpecific.restore())
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
		.pipe(size());
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

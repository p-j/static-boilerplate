'use strict';

var _ = require('underscore'),
	gulp = require('gulp'),
	sass = require('gulp-ruby-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	minifycss = require('gulp-minify-css'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	imagemin = require('gulp-imagemin'),
	rename = require('gulp-rename'),
	clean = require('gulp-clean'),
	concat = require('gulp-concat'),
	cache = require('gulp-cache'),
	connect = require('gulp-connect');

var config = {
	src: 'src',
	dist: 'dist',
	port: 9013,
	lr: {
		port: 35731
	}
};

var bower = {
	fonts: [
		'bower_components/bootstrap-sass/vendor/assets/fonts/bootstrap/*'
	],
	scripts: [
		'bower_components/jquery/dist/jquery.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/affix.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/alert.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/button.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/carousel.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/collapse.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/dropdown.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/tab.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/transition.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/scrollspy.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/modal.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/tooltip.js',
		'bower_components/bootstrap-sass/vendor/assets/javascripts/bootstrap/popover.js',
		'bower_components/modernizr/modernizr.js'
	]
};

bower = _.each(bower, function (cat, key) {
	bower[key] = _.map(cat, function (src) {
		return config.src + '/' + src;
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
		.pipe(sass({
			style: 'expanded',
			sourcemap: true,
			precision: 10,
			loadPath: ['src/bower_components/']
		}))
		.pipe(autoprefixer('last 3 version'))
		.pipe(gulp.dest('dist/assets/css'))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(minifycss())
		.pipe(connect.reload())
		.pipe(gulp.dest('dist/assets/css'));
});

// Fonts
gulp.task('fonts', function () {
	return gulp.src(bower.fonts)
		.pipe(connect.reload())
		.pipe(gulp.dest('dist/assets/fonts'));
});

// Scripts
gulp.task('scripts', function () {
	return gulp.src(_.flatten([bower.scripts, 'src/scripts/**/*.js']))
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(concat('main.js'))
		.pipe(gulp.dest('dist/assets/js'))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(uglify())
		.pipe(connect.reload())
		.pipe(gulp.dest('dist/assets/js'));
});

// Images
gulp.task('images', function () {
	return gulp.src('src/images/**/*')
		.pipe(cache(imagemin({
			optimizationLevel: 5,
			progressive: true,
			interlaced: true
		})))
		.pipe(connect.reload())
		.pipe(gulp.dest('dist/assets/img'));
});

// HTML
gulp.task('html', ['styles', 'scripts'], function () {
	return gulp.src('src/*.html')
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
	gulp.start('fonts', 'images', 'html', 'copy');
});

// Watch
gulp.task('watch', function () {
	// gulp.watch('<pattern>', [tasks]);
	gulp.watch('src/styles/**/*.scss', ['styles']);
	gulp.watch('src/scripts/**/*.js', ['scripts']);
	gulp.watch('src/images/**/*', ['images']);
	gulp.watch('src/**/*.html', ['html']);
});

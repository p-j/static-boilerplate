Static Site Boilerplate
==================

A static website boilerplate featuring Bootstrap SASS, Gulp streaming build tool and other niceties

Usage
==================
Prerequisite :
- ~~ruby & sass gem (may move to libsass and node-sass once tested)~~ *Now libsass with node-sass and gulp-sass is the default, you can still change back to gulp-ruby-sass easily as I just commented out the [configuration lines](https://github.com/p-j/static-boilerplate/blob/master/gulpfile.js#L100-L117)*
- node w/ npm
- bower
- gulp

And then :

```
$ git clone https://github.com/p-j/static-boilerplate.git
$ cd static-boilerplate
$ npm install && bower install
$ gulp
```

That was easy !

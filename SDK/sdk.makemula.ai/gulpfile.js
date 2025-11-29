require('dotenv').config();
var gulp = require('gulp');
var mustache = require('gulp-mustache');
var minify = require('gulp-minify');
var environments = require('./environments');

console.log(`Running gulp in environment ${process.env.ENVIRONMENT}`);

gulp.task('mustache', async function(done) {
  gulp.src('src/js/mula.js')
    .pipe(
      mustache(environments[process.env.ENVIRONMENT || 'development'])
    )
    .pipe(minify({
        ext:{
            src:'-debug.js',
            min:'.js'
        },
      })
    )
    .pipe(gulp.dest('./dist/js'));

  gulp.src(['./svelte-components/dist/**/*'])
    .pipe(gulp.dest(`./dist/sdk/${process.env.npm_package_version}/js`));
  done();
});

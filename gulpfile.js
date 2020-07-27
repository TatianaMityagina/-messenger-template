const gulp = require('gulp');

// general
const rename = require('gulp-rename');
const clean = require('del');
const include = require('gulp-rigger');
const plumber = require('gulp-plumber');
const newer = require('gulp-newer');

const server = require('browser-sync').create();

// css
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const bulkSass = require('gulp-sass-bulk-import');
const autoprefixer = require('gulp-autoprefixer');
const cssMinify = require('gulp-csso');

// js
const jsMinify = require('gulp-uglify');

// img
const imgMinify = require('gulp-imagemin');
const svgstore = require('gulp-svgstore');


gulp.task('clean', () =>
  clean('build')
);

gulp.task('copy', () => gulp.src([
    'src/*.html',
    'src/favicon/**/*',
    'src/font/**/*.{woff,woff2}',
    'src/js/**/*.js',
    'src/img/**/*',
    'src/video/**/*',
    'src/data/**/*'
  ], {
    base: 'src'
  })
  .pipe(gulp.dest('build'))
);


gulp.task('html:copy', () => gulp.src('src/*.html')
    .pipe(gulp.dest('build'))
);

gulp.task('html:include', () => gulp.src('src/*.html')
    .pipe(include())
    .pipe(gulp.dest('build'))
);


gulp.task('css', () => gulp.src('src/sass/style.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(bulkSass())
    .pipe(sass())
    .pipe(autoprefixer({
      flexbox: 'no-2009'
    }))
    .pipe(gulp.dest('build/css'))
    .pipe(cssMinify())
    .pipe(rename('style.min.css'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream())
);


gulp.task('js:copy', () => gulp.src('src/js/**/*.js')
    .pipe(newer('build/js'))
    .pipe(gulp.dest('build/js'))
);

gulp.task('js:include', () => gulp.src('src/js/**/*.js')
    .pipe(plumber())
    .pipe(include())
    .pipe(gulp.dest('build/js'))
);

gulp.task('js:minify', () => gulp.src('build/js/*.js')
    .pipe(jsMinify())
    .pipe(gulp.dest('build/js'))
);


gulp.task('img:copy', () => gulp.src('src/img/**')
    .pipe(newer('build/img'))
    .pipe(gulp.dest('build/img'))
);

gulp.task('img:minify', () => gulp.src('build/img/**/*.{png,jpg,svg}')
    .pipe(imgMinify([
      imgMinify.jpegtran(
        {progressive: true}
      ),
      imgMinify.svgo({
        plugins: [
          {removeViewBox: false},
          {removeRasterImages: true}
        ]
      })
    ]))
    .pipe(gulp.dest('build/img'))
);

gulp.task('img:svg-sprite', () => gulp.src('src/img/svg-sprite/*.svg')
    .pipe(imgMinify([
      imgMinify.svgo({
        plugins: [
          {removeViewBox: false},
          {removeRasterImages: true}
        ]
      })
    ]))
    .pipe(svgstore())
    .pipe(gulp.dest('build/img'))
);


gulp.task('serve', () => {
  server.init({
    server: 'build/',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch('src/**/*.html', gulp.series('html:copy', 'html:include')).on('change', server.reload);
  gulp.watch('src/sass/**/*.scss', gulp.series('css'));
  gulp.watch('src/js/**/*.js', gulp.series('js:copy', 'js:include', 'js:minify')).on('change', server.reload);
  gulp.watch('src/img/**/*', gulp.series('img:copy'));
  gulp.watch('src/img/svg-sprite/*.svg', gulp.series('img:svg-sprite'));
});


gulp.task('build', gulp.series(
  'clean',
  'copy',
  'html:include',
  'css',
  'js:include',
  'js:minify',
  'img:minify',
  'img:svg-sprite'
));

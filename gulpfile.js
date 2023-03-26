import * as nodePath from 'path'
import fs            from 'fs'

import gulp          from 'gulp'
import {deleteAsync} from 'del'
import browserSync   from 'browser-sync'
import panini        from 'panini'
import inky          from 'inky'
import dartSass      from 'sass'
import gulpSass      from 'gulp-sass'
import imagemin      from 'gulp-imagemin'
import newer         from 'gulp-newer'
import replace       from 'gulp-replace'
import inlineCss     from 'gulp-inline-css'
import htmlMin       from 'gulp-htmlmin'

const sass = gulpSass(dartSass)


/** Folders */
const rootFolder = nodePath.basename(nodePath.resolve())
const srcFolder  = `./src`
const destFolder = `./docs`


/** Paths */
export const path = {
  watch: {
    emails: `${srcFolder}/{pages,layouts,partials}/**/*.html`,
    styles: `${srcFolder}/scss/**/*.scss`,
    images: `${srcFolder}/images/**/*.{jpg,jpeg,png,gif}`,
  },
  rootFolder: rootFolder,
  srcFolder: srcFolder,
  destFolder: destFolder,
  cleanFolder: destFolder,
}


/** Reset */
const reset = () => {
  return deleteAsync(`${destFolder}`)
}


/** Browser Sync */
const server = (done) => {
  browserSync.init({
    server: {
      baseDir: [`${destFolder}`]
    },
    online: true,
    notify: false,
  }, done)
}


/** Emails */
const emails = () => {
  panini.refresh()
  return gulp.src([`${srcFolder}/pages/**/*.html`, `!${srcFolder}/pages/archive/**/*.html`], {})
  .pipe(panini({
    root:     `${srcFolder}/pages/`,
    layouts:  `${srcFolder}/layouts/`,
    partials: `${srcFolder}/partials/`,
    helpers:  `${srcFolder}/pages/helpers/`,
    data:     `${srcFolder}/pages/data/`
  }))
  .pipe(inky())
  .pipe(gulp.dest(`${destFolder}`), {})
  .pipe(browserSync.stream())
}


/** Styles */
const styles = () => {
  return gulp.src(`${srcFolder}/scss/app.scss`)
  .pipe(sass.sync(
    {includePaths: ['node_modules/foundation-emails/scss']}
  ))
  .pipe(gulp.dest(`${destFolder}/css`))
  .pipe(browserSync.stream())
}


/** Images */
const images = () => {
  return gulp.src([`${srcFolder}/images/**/*.{jpg,jpeg,png,gif}`, `!${srcFolder}/images/archive/**/*`])
  .pipe(newer(`${destFolder}/images`))
  .pipe(imagemin({
    quality: 80, // jpg
    optimizationLevel: 5, // png
  }))
  .pipe(gulp.dest(`${destFolder}/images`))
  .pipe(browserSync.stream())
}


/** Inline CSS */
const inline = () => {
  return gulp.src(`${destFolder}/**/*.html`)
  .pipe(inlineCss({
    // Встраивать стили в файлы <style></style> [default: true]
    applyStyleTags: true,

    // Удалять теги <style></style> после встраивания в style="" [default: true]
    removeStyleTags: true,

    // Вставлять стили из <link rel="stylesheet"> в inline стили [default: true]
    applyLinkTags: true,

    // Удалять исходные <link rel="stylesheet"> после встраивания из них css [true]
    removeLinkTags: true,

    // Сохраняет все медиа-запросы (и содержащиеся в них стили) в <style></style> тегах в качестве уточнения, когда removeStyleTags установлено значение true. Другие стили удалены. [default: false]
    preserveMediaQueries: true,

    // removeHtmlSelectors: false,
    // applyWidthAttributes: true,
    applyTableAttributes: false, // [default: false]
    // lowerCaseTags: true,
    // lowerCaseAttributeNames: true,
  }))
  .pipe(htmlMin({
    collapseWhitespace: true,
    minifyCSS: true
  }))
  .pipe(gulp.dest(`${destFolder}`))
  .pipe(browserSync.stream())
}


/** Watcher */
const watcher = () => {
  gulp.watch(path.watch.emails, emails).on('change', gulp.series(emails, styles, inline, browserSync.reload))
  gulp.watch(path.watch.styles, styles).on('change', gulp.series(reset, styles, emails, images, inline, browserSync.reload))
  gulp.watch(path.watch.images, images).on('change', gulp.series(images, browserSync.reload));
}

const emailTasks = gulp.series(emails, styles, images, inline)
const dev = gulp.series(reset, emailTasks, gulp.parallel(watcher, server))

/** Default task */
gulp.task('default', dev)

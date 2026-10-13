const express = require('express')
const router = new express.Router()

// Add your routes here - above the module.exports line

router.use((req, res, next) => {
  // e.g. "/ur-feb-2026/B-off-system-MVP/..." → "ur-feb-2026"
  const first = (req.path.split('/')[1] || '').trim();

  // Basic allow-list pattern: "version-12" or "ur-feb-2026"
  const looksLikeVersion = /^(version-\d+|ur-[a-z]{3}-\d{4})$/i.test(first);

  res.locals.VERSION = looksLikeVersion ? first : 'version-12'; // fallback if needed
  next();
});



// ✅ Make session data available to all Nunjucks templates
router.use((req, res, next) => {
  res.locals.data = req.session.data || {};
  next();
});

// GET SPRINT NAME - useful for relative templates

// route middleware that will happen on every request
router.use('/', (req, res, next) => {
  res.locals.currentURL = req.originalUrl; //current screen
  res.locals.prevURL = req.get('Referrer'); // previous screen
  //  console.log('previous page is: ' + res.locals.prevURL + " and current page is " + req.url + " " + res.locals.currentURL );
  next();
});


///////////////////////////////////////// New router functionality /////////////////////////////////////////


// User Research and design versions
router.use('/version-0', require('./views/version-0/_routes'))
router.use('/version-1', require('./views/version-1/_routes'))
router.use('/version-2', require('./views/version-2/_routes'))
router.use('/version-3', require('./views/version-3/_routes'))
router.use('/version-4', require('./views/version-4/_routes'))
router.use('/version-5', require('./views/version-5/_routes'))
router.use('/version-6', require('./views/version-6/_routes'))
router.use('/version-7', require('./views/version-7/_routes'))
router.use('/version-8', require('./views/version-8/_routes'))
router.use('/version-9', require('./views/version-9/_routes'))
router.use('/version-10', require('./views/version-10/_routes'))
router.use('/version-11', require('./views/version-11/_routes'))
router.use('/ur-dec-2025-closed', require('./views/ur-dec-2025-closed/_routes'))
router.use('/version-12', require('./views/version-12/_routes'))
router.use('/ur-feb-2026-closed', require('./views/ur-feb-2026-closed/_routes'))
router.use('/version-13', require('./views/version-13/_routes'))
router.use('/ur-mar-2026-closed', require('./views/ur-mar-2026-closed/_routes'))
router.use('/version-14', require('./views/version-14/_routes'))
router.use('/manage-materials-beta-v1', require('./views/manage-materials-beta-v1/_routes'))
router.use('/ur-apr-2026-closed', require('./views/ur-apr-2026-closed/_routes'))
router.use('/version-15', require('./views/version-15/_routes'))
router.use('/ur-may-2026-closed', require('./views/ur-may-2026-closed/_routes'))
router.use('/version-16', require('./views/version-16/_routes'))
router.use('/version-17', require('./views/version-17/_routes'))
router.use('/version-18', require('./views/version-18/_routes'))
router.use('/version-19', require('./views/version-19/_routes'))
router.use('/ur-jun-2026-closed', require('./views/ur-jun-2026-closed/_routes'))


module.exports = router

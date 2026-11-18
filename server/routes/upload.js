const router = require('express').Router();
const imagekit = require('../config/imagekit');
const { protect } = require('../middleware/auth');
// Only signed, short-lived parameters leave the server; the private key never does.
router.get('/auth', protect, (req, res) => {
  res.json({ ...imagekit.getAuthenticationParameters(), publicKey: process.env.IMAGEKIT_PUBLIC_KEY, urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT });
});
module.exports = router;

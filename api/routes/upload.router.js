const express = require('express');
const router = express.Router();
const multer = require('multer');

const path = function () {
  return __dirname.split('/')
    .slice(0, __dirname.split('/').length - 1)
    .join('/')
    .concat('/public/images/');
};

const upl = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path());
    },
    filename: function (req, file, cb) {
      cb(null, `${file.fieldname}-${new Date().getTime()}.${file.originalname.split('.').pop()}`);
    }
  })  
});

router.post('/', upl.single('profile_image'), async (req, res) => {
  console.log(req.file);
  res.send('ok');
});

router.post('/many-images', upl.array('many_images'), async (req, res) => {
  console.log(req.files);
  res.send('okay');
});

module.exports = router;
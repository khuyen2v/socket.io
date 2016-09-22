var mongoose = require('mongoose');
var uri = 'mongodb://localhost/edx';
mongoose.connect(uri, function(error) {
    if (error) return console.error(error);
});

module.exports = mongoose;

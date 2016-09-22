var mongoose = require('mongoose');

var courseSchema = new mongoose.Schema({
    name : String,
    iid : Number
});

module.exports = mongoose.model('Category', courseSchema);
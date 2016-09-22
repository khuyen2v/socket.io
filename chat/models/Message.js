var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var messageSchema = new mongoose.Schema({
    ids: Number,
    room_iid: Number,
    user_name: String,
    message: String,
    time_create: Number,
    status: Number
}, { versionKey: false });
autoIncrement.initialize(mongoose.connection);
messageSchema.plugin(autoIncrement.plugin, {model: 'Message', field: 'ids'});
module.exports = mongoose.model('Message', messageSchema);
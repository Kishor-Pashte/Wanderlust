const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    username: String,
    email: String,
    listings: [
        {
            type: Schema.Types.ObjectId,
            ref: "Listing",
        }
    ]
});


userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js"); // Import User model

const mongo_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(mongo_URL);
}

const initDB = async () => {
    const ownerId = new mongoose.Types.ObjectId("6873ab8b895a035e2aefeb7f");

    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ ...obj, owner: ownerId }));

    const insertedListings = await Listing.insertMany(initData.data);

    // ✅ Updating the User's listings array after inserting listings
    await User.findByIdAndUpdate(ownerId, {
        $set: { listings: insertedListings.map((listing) => listing._id) },
    });

    console.log("data was initialized");
};

initDB();

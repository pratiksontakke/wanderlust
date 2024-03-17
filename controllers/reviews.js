const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let review = new Review(req.body.review);
    review.author = req.user._id;
    listing.reviews.push(review);
    await review.save();
    await listing.save();
    req.flash("success", "Review Created!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.distroyReview = async (req, res) => {
    let { id, review_id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {
        $pull: { reviews: review_id },
    });
    await Review.findByIdAndDelete(review_id);
    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${listing._id}`);
};

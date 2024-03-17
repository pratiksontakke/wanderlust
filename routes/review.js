const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const reviewController = require("../controllers/reviews.js");

const {
    validateReview,
    isLoggedIn,
    isReviewAuthor,
} = require("../middleware.js");

//Post route
router.post(
    "/",
    isLoggedIn,
    validateReview,
    wrapAsync(reviewController.createReview)
);

router.delete(
    "/:review_id",
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewController.distroyReview)
);

module.exports = router;

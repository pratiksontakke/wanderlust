if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const app = express();
const path = require("path");
const methodOverride = require("method-override");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
app.engine("ejs", ejsMate);

const dbUrl = process.env.ATLASDB_URL;

async function main() {
    await mongoose.connect(dbUrl);
}

main()
    .then(() => {
        console.log("Mongoose connection in successful");
    })
    .catch((err) => {
        console.log(err);
    });

let store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 60 * 60,
});

store.on("err", () => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

let sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

// app.get(
//     "/",
//     wrapAsync((req, res) => {
//         res.send("Hi I am root");
//     })
// );

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser", async (req, res) => {
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student",
//     });
//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);

app.use("/", userRouter);

/* Testing */

// app.get("/getcookies", (req, res) => {
//     console.log(req.cookies.greed);
//     res.send("cookies saved");
// });

// app.get("/getsignedcookies", (req, res) => {
//     res.cookie("made-in", "India", { signed: true });
//     res.send("Signed cookie send");
// });
// // s%3AChina.qMBbm%2BbYzZufHMhKWlHjE%2BjSrC8V2tPwNG5rQkFBmJw
// // s%3AIndia.JToTmuBSNK8i445NVsjG86EI61Y4iFlOKCRP%2FYQz39M
// app.get("/verify", (req, res) => {
//     console.log(req.signedCookies);
//     res.send("Verified");
// });

app.all(
    "*",
    wrapAsync((req, res, next) => {
        next(new ExpressError(404, "Page not found"));
    })
);

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Some error accored" } = err;
    res.status(statusCode).render("error.ejs", { message });
    next(err);
});

app.listen(8080, () => {
    console.log("Server is listening to port 8080");
});

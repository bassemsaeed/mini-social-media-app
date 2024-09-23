import express from "express"
import session from "express-session"
import passport from "passport"
import pg from "pg"
import bcrypt from "bcrypt"
import { Strategy as LocalStrategy } from "passport-local"
import { validationResult } from "express-validator"
import connectPgSimple from "connect-pg-simple"
import { fileURLToPath } from "url"
import path, { dirname } from "path"
import { signUpValidation } from "./utils/validations.js"


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const assetsPath = path.join(__dirname, 'public')

const app = express();
const PORT = process.env.PORT || 3000;

const {Pool} = pg;
const pool = new Pool({
    connectionString: 'postgresql://posts_owner:5Ikhj0NlMYdv@ep-young-poetry-a58vec1e.us-east-2.aws.neon.tech/posts?sslmode=require'
})

const pgSession = connectPgSimple(session);



app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.use(express.static(assetsPath))

app.use(express.urlencoded({extended: true}));


app.use(session({
    secret: 'tkalfemfsdf1323#@#lsdf',
    resave: false,
    saveUninitialized: false,
    store: new pgSession({
        pool: pool,
        tableName: 'users_sessions'
    }),
    cookie: {
        maxAge: ( 1000 * 60 * 60 * 24 * 4),
    }
}));


const localStrategy = new LocalStrategy(async (username, passowrd, done) => {




});


passport.serializeUser((user, done) => {

    done(null, user.id)
})


app.get("/", (req, res) => {

    res.render("home-page", {})
});

app.get("/sign-up", (req, res) => {



    res.render("sign-up", {})

});


app.post("/sign-up", signUpValidation, async (req, res) => {

    console.log(req.session);
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        console.log(req.body);
        
        console.log(errors.array());
        return res.render("sign-up", {errs: errors.array(), inputs: req.body})
        
    }

    const {first_name: firstName, last_name: lastName, user_name: username, user_password} = req.body;

    const password = await bcrypt.hash(user_password, 10);
    try {
        await pool.query(
            `
                INSERT INTO users (username, first_name, last_name, password) VALUES (LOWER($1), $2, $3, $4);
            `, [username, firstName, lastName, password]);

        res.redirect("/log-in")
    } catch (error) {
        console.log(error);  
        res.render("sign-up", {serverErr: {msg: "An unexpected error occurred, please try again."}, inputs: req.body})
    }
    
    
})


app.get("/log-in", (req, res) => {

    res.render("log-in");

});




app.listen(PORT, () => {


    console.log(`Server running on - http://localhost:${PORT}`);
    
})
import express from "express"
import session from "express-session"
import passport from "passport"
import session_store from "express-session"
import { Strategy as LocalStrategy } from "passport-strategy"
import { body, validationResult } from "express-validator"
import { fileURLToPath } from "url"
import path, { dirname } from "path"


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const assetsPath = path.join(__dirname, 'public')

const app = express();
const PORT = process.env.PORT || 3000;


app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.use(express.static(assetsPath))


app.get("/sign-up", (req, res) => {



    res.render("sign-up", {})

});




app.listen(PORT, () => {


    console.log(`Server running on - http://localhost:${PORT}`);
    
})
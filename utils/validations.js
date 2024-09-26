import { body, validationResult } from "express-validator"
import pg from "pg"

const {Pool} = pg;

const pool = new Pool({
    connectionString: 'postgresql://posts_owner:5Ikhj0NlMYdv@ep-young-poetry-a58vec1e.us-east-2.aws.neon.tech/posts?sslmode=require'
});


const signUpValidation = [


    body('first_name')
    .trim()
    .isAlpha()
    .withMessage('first name must only contain letters')
    .isLength({min: 3, max: 15})
    .withMessage('first name must be between 3 and 10 chars')
    ,

    body('last_name')
    .trim()
    .isAlpha()
    .withMessage('first name must only contain letters')
    .isLength({min: 3, max: 15})
    .withMessage('first name must be between 3 and 10 chars')
    ,

    body('user_name')
    .trim()
    .isLength({min: 3, max: 30})
    .withMessage('user name must be between 3 and 30 chars')
    .custom(async (value) => {
        const {rows} = await pool.query(`select * from users where username = LOWER($1)`, [value])
        const user = rows[0];
       
        
        if(user) {
            throw new Error('This Username Exists. Try a new one.')
        }
    })
    ,

    body('user_password')
    .trim()
    .isLength({ min: 8 }) // Enforce a minimum length (adjust as needed)
    .withMessage('password must be at least 8 chars long')
    
    ,

    body('confirmed_user_password')
    .custom((value, {req}) => {
        const password = req.body.user_password;

        if(value !== password) {
            throw new Error('Passwords must match.');
        } else {
            return true;
        }
    })


]



const pfp_validation = [
    body('pfp_link')
      .trim()
      .matches(/^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i) // Case-insensitive regex
      .withMessage('Please provide a valid image link ending with .png, .jpg, .jpeg, .gif, or .webp')
  ];


  function timeAgo(dateString) {
    const now = new Date(); // Current time
    const pastDate = new Date(dateString); // Convert the input string to a Date object
    const diffInMilliseconds = now - pastDate; // Difference in milliseconds

    // Time units in milliseconds
    const seconds = 1000;
    const minutes = seconds * 60;
    const hours = minutes * 60;
    const days = hours * 24;
    const weeks = days * 7;
    const months = days * 30.44; // Average days in a month
    const years = days * 365.25; // Including leap years

    // Calculate the difference in each time unit
    if (diffInMilliseconds < minutes) {
        const diffInSeconds = Math.floor(diffInMilliseconds / seconds);
        return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < hours) {
        const diffInMinutes = Math.floor(diffInMilliseconds / minutes);
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < days) {
        const diffInHours = Math.floor(diffInMilliseconds / hours);
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < weeks) {
        const diffInDays = Math.floor(diffInMilliseconds / days);
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < months) {
        const diffInWeeks = Math.floor(diffInMilliseconds / weeks);
        return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < years) {
        const diffInMonths = Math.floor(diffInMilliseconds / months);
        return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    } else {
        const diffInYears = Math.floor(diffInMilliseconds / years);
        return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
    }
}

// Example usage:



const isAuth = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
      } else {
    
        res.status(401).json({message: 'Not Authorized.'})
      }
}


export {signUpValidation, pfp_validation, timeAgo, isAuth}
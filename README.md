FCC API & Microservices
=======================
Project 04: Exercise Tracker
============================


User Stories:
------------

1. I can POST a form data username to `[project_url]/api/exercise/new-user` and create a new user. In return I will receive a JSON response  
containing the username and _id.  

    Example: `{username:"Theusername", _id:1424ds}`

2. I can use the API end point GET `[project_url]/api/exercise/users` to obtain an array of all registered users and their details.

3. I can POST a form data to `[project_url]/api/exercise/add` to add information to any registered user. The userId(_id), exercise and duration 
are mandatory fields while date is optional. If date is not supplied, the app will use the date at the moment of submission.

4. The POST of the form data will return a JSON response containing all the information for the given userId(_id). 

5. I can use the API end point GET `[project_url]/api/exercise/log` with a parameter of userID(_id) to retrieve the user object with added
array log and count (total exercise count).

6. I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int).


The Project:
------------

On the front-end:
1. Edit `public/client.js`, `public/style.css` and `views/index.html`
2. Drag in `assets`, like images or music, to add them to your project  
On the back-end:
3. Your app starts at `server.js`
4. Add frameworks and packages in `package.json`
5. Safely store app secrets in `.env` (nobody can see this but you and people you invite)
instaget
========

instaget seeks to solve the problem of obtaining one's own Instagram photos. Once a user has allowed instaget to access his or her Instagram account, instaget displays all the user's photos and allows the user to sort by photo filter or tag. Then the user can select some (or all) photos and download the selected photos as a single zip file.

See it in action [here](http://instaget.herokuapp.com).

About the code
--------------

####Server Side:
I used [node.js](http://www.nodejs.org) and [express.js](http://expressjs.com) to build the server and [consolidate](https://github.com/visionmedia/consolidate.js)/[swig](http://paularmstrong.github.io/swig/) for html templating. I used routing and learned how to separate my code into modularized files that I then required where necessary.

####Client Side:
I did not use any client-side libraries (like jQuery) because I wanted experience handling XML HTTP requests and the related code by myself. Doing so taught me a lot about how helpful jQuery is (heh), and lead me to write my own client-side event handler to keep my server communication code cleanly separated from my DOM-manipulation code.

Challenges
-----------

####Instagram OAuth 2.0 Authorization
This was tricky. We did not use any library or helper to do this. The difficult part of getting the OAuth to work was POSTing our initial user code to the Instagram server to get our access token. For anyone else interested in doing something similar, I outlined the steps in a blog post: [An Ode to OAuth](http://emilysommer.com/blog/an-ode-to-oauth/).

####Downloading Files to Server & Zipping
I caved in and used a library ([targz](https://github.com/cranic/node-tar.gz)) to help me tar up the photo files into a compressed folder to zip.

Future To-Dos:
--------------
- Clean up and modularize the backend. I rewrote the entired client-end, which caused some rewriting of the backend, but I've not yet thrown away the old code. There are also several areas where I could modularize the code more.
- Dropbox integration
- Database backend for saving users and access tokens
- Create modal for displaying individual photos when clicked
- Styling improvements (I did not use Bootstrap -- just a little vanilla CSS)

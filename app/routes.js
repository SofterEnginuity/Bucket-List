const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Directory to save uploads
const { ObjectId } = require('mongodb');
module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('Crud1').find().toArray((err, result) => {
          console.log(result)
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            items: result
          })
        })
    });

    

    
    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout(() => {
          console.log('User has logged out!')
        });
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/messages', (req, res) => {
      db.collection('Crud1').save({name: req.body.name, location: req.body.location, budget: req.body.budget}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })

    app.put('/messages', (req, res) => {
      const { _id, ...updatedFields } = req.body;
    
      db.collection('Crud1')
        .findOneAndUpdate(
          { _id: new ObjectId(_id) }, // Query to find the specific document by its ID
          { $set: updatedFields }, // Dynamically set fields based on client input
          { returnDocument: 'after' },
          (err, result) => {
            if (err) return res.send(err);
            res.send(result);
          }
        );
    });

//photo upload?

app.post('/uploadPhoto', upload.single('photo'), (req, res) => {
  console.log('File received:', req.file);
  console.log(req.body);

  if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded!' });
  }

  const id = req.body.id; // The ID of the document you want to update
  const photoPath = `/uploads/${req.file.filename}`; // Path of uploaded file
console.log(id)

  db.collection('Crud1').updateOne(
      { _id: ObjectId(id) },
      { $set: { photo: photoPath } },
      (err, result) => {
          if (err) return res.status(500).json({ success: false, error: err });
          res.redirect('/profile')
      }
  );
});


    // app.put('/messages2', (req, res) => {
    //   db.collection('Crud1')
    //   .findOneAndUpdate({name: req.body.name, location: req.body.location}, {
    //     $set: {
    //       thumbUp:req.body.thumbUp - 1
    //     }
    //   }, {
    //     sort: {_id: -1},
    //     upsert: true
    //   }, (err, result) => {
    //     if (err) return res.send(err)
    //     res.send(result)
    //   })
    // })

    app.delete('/messages/:itemId', (req, res) => {
      // const itemId = req.body._id;
    console.log(req.params.itemId)
      db.collection('Crud1').findOneAndDelete({ _id: new ObjectId(req.params.itemId) }, (err, result) => {
        
        if (err) return res.status(500).send(err);
        res.send('Item deleted!');
      });
    });
    

    
// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};
 
// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

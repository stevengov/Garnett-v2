const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const shrinkRay = require('shrink-ray');
const app = express();
const equal = require('deep-equal');
const firebase = require('@firebase/app').firebase;
require('@firebase/auth');
require('@firebase/messaging');
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const port = process.env.PORT || 4000;
global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

require('dotenv').config();

// Firebase Config
firebase.initializeApp({
  apiKey: "AIzaSyAR48vz5fVRMkPE4R3jS-eI8JRnqEVlBNc",
  authDomain: "garnett-42475.firebaseapp.com",
  databaseURL: "https://garnett-42475.firebaseio.com",
  projectId: "garnett-42475",
  storageBucket: "garnett-42475.appspot.com",
  messagingSenderId: "741733387760"
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://garnett-42475.firebaseio.com",
  projectId: "garnett-42475"
});

// Redirect all HTTP traffic to HTTPS
function ensureSecure(req, res, next){
  if (req.headers["x-forwarded-proto"] === "https") {
    // OK, continue
    return next();
  }
  res.redirect('https://'+ req.hostname + req.url);
};

// Handle environments
if (process.env.NODE_ENV == 'production') {
  app.all('*', ensureSecure);
}

app.use(shrinkRay()); // Gzips file
app.use(express.static(path.join(__dirname, './client/build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('*', (req, res) => {
  if (process.env.NODE_ENV == 'production') {
    res.sendFile(path.join(__dirname, './client/build/index.html'));
  }
  else {
    res.sendFile(path.join(__dirname, './client/public/index.html'));
  }
});

// Retrieving Authentication Status Route
app.get('/api', function(req, res) {
  // Send back user's info to the client
  const { displayName } = req.params;
  console.log(displayName)
  const userRef = admin.database().ref('/users/' + displayName);
  console.log(displayName)

  userRef.once('value', (user) => {
    res.json(user.val());
  });
});

// Get Firebase Data Route
app.get('/api/firebaseData', function(req, res) {
  const firebaseData = {
    apiKey: 'AIzaSyAR48vz5fVRMkPE4R3jS-eI8JRnqEVlBNc',
    authDomain: 'garnett-42475.firebaseapp.com',
    databaseURL: 'https://garnett-42475.firebaseio.com',
    storageBucket: 'garnett-42475.appspot.com',
    messagingSenderId: '741733387760'
  }

  res.json(firebaseData);
});

// Query for pledges data
app.get('/api/pledges', function(req, res) {
  const usersRef = admin.database().ref('/users');
  let pledgeArray = [];

  usersRef.once('value', (users) => {
    users.forEach((child) => {
      if (child.val().status === 'pledge') {
        pledgeArray.push(child.val());
      }
    });

    pledgeArray.sort((a, b) => {
      return a.lastName > b.lastName ? 1 : -1;
    });

    console.log("Pledge array: ", pledgeArray);
    res.json(pledgeArray);
  });
});

// Query for active data
app.get('/api/actives', function(req, res) {
  const usersRef = admin.database().ref('/users');
  let activeArray = [];

  usersRef.once('value', (users) => {
    users.forEach((child) => {
      if (child.val().status !== 'pledge') {
        activeArray.push(child.val());
      }
    });

    activeArray.sort((a, b) => {
      return a.lastName > b.lastName ? 1 : -1;
    });

    console.log("Active array: ", activeArray);
    res.json(activeArray);
  });
});

// Query for merit data on Pledge App
app.get('/api/pledgeData', function(req, res) {
  const { displayName } = req.params;
  const userRef = admin.database().ref('/users/' + displayName);
  let meritArray = [];
  let complaintsArray = [];

  userRef.once('value', (user) => {
    const totalMerits = user.val().totalMerits;

    if (user.val().Merits) {
      meritArray = Object.keys(user.val().Merits).map(function(key) {
        return user.val().Merits[key];
      });
    }

    if (user.val().Complaints) {
      complaintsArray = Object.keys(user.val().Complaints).map(function(key) {
        return user.val().Complaints[key];
      });
    }

    console.log('Merit array: ', meritArray);
    console.log('Complaints array: ', complaintsArray);

    const data = {
      totalMerits: totalMerits,
      meritArray: meritArray.reverse(),
      complaintsArray: complaintsArray
    };

    res.json(data);
  });
});

// Query for the specified pledge's merits
app.get('/api/pledgeMerits', function(req, res) {
  const { pledgeName } = req.params;
  const meritsRef = admin.database().ref('/users/' + pledgeName + '/Merits');
  let merits = [];

  meritsRef.once('value', (snapshot) => {
    if (snapshot.val()) {
      merits = Object.keys(snapshot.val()).map(function(key) {
        return snapshot.val()[key];
      }).sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
    }

    res.json(merits);
  });
});

// Query for the specified pledge's complaints
app.get('/api/pledgeComplaints', function(req, res) {
  const { pledgeName } = req.params;
  const complaintsRef = admin.database().ref('/users/' + pledgeName + '/Complaints');
  let complaints = [];

  complaintsRef.once('value', (snapshot) => {
    if (snapshot.val()) {
      complaints = Object.keys(snapshot.val()).map(function(key) {
        return snapshot.val()[key];
      }).sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
    }

    res.json(complaints);
  });
});

// Signup Route
app.post('/api/signup', function(req, res) {
  const usersRef = admin.database().ref('/users');
  let firstName = req.body.firstName.replace(/ /g,'');
  let lastName = req.body.lastName.replace(/ /g,'');
  firstName = firstName[0].toUpperCase() + firstName.substr(1);
  lastName = lastName[0].toUpperCase() + lastName.substr(1);
  const fullName = firstName + lastName;
  const checkRef = admin.database().ref('/users/' + fullName);

  checkRef.once('value', (snapshot) => {
    if (req.body.year === 'Alumni') {
      if (snapshot.val()) {
        // Create user with email and password
        firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
        .then((user) => {
          if (user && !user.emailVerified) {
            user.updateProfile({
              displayName: fullName
            })
            .then(function() {
              const userRef = usersRef.child(user.displayName);

              userRef.update({
                firstName: req.body.firstName.trim(),
                lastName: req.body.lastName.trim(),
                class: req.body.className,
                major: req.body.majorName,
                year: req.body.year,
                phone: req.body.phone,
                email: req.body.email.trim(),
                status: 'alumni'
              });

              usersRef.once('value', (users) => {
                users.forEach((child) => {
                  if (child.val().status === 'pledge') {
                    const pledgeName = child.key;

                    userRef.child('/Pledges/' + pledgeName).set({
                      merits: 200
                    });
                  }
                });
              });

              user.sendEmailVerification()
              .then(function() {
                res.status(200).send('Verification email has been sent.');
              });
            })
            .catch(function(error) {
              // Handle errors here.
              const errorCode = error.code;
              const errorMessage = error.message;

              console.log(errorCode, errorMessage);
              res.status(400).send('Something went wrong on the server.');
            });
          }
        })
        .catch(function(error) {
          // Handle errors here.
          const errorCode = error.code;
          const errorMessage = error.message;

          console.log(errorCode, errorMessage);
          res.status(400).send('Email has already been taken.');
        });
      }
      else {
        res.status(400).send('This alumni does not exist in our database.');
      }
    }
    else {
      if (snapshot.val()) {
        res.status(400).send('This active is already signed up.');
      }
      else {
        // Create user with email and password
        firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
        .then((user) => {
          if (user && !user.emailVerified) {
            user.updateProfile({
              displayName: fullName
            })
            .then(function() {
              const userRef = usersRef.child(user.displayName);

              userRef.set({
                firstName: req.body.firstName.trim(),
                lastName: req.body.lastName.trim(),
                class: req.body.className,
                major: req.body.majorName,
                year: req.body.year,
                phone: req.body.phone,
                email: req.body.email.trim(),
                photoURL: 'https://cdn1.iconfinder.com/data/icons/ninja-things-1/720/ninja-background-512.png',
              });

              if (req.body.code === req.body.pledgeCode) {
                userRef.update({
                  status: 'pledge',
                  totalMerits: 0
                });

                usersRef.once('value', (users) => {
                  users.forEach((child) => {
                    const pledgeName = user.displayName;
                    
                    if (child.val().status === 'alumni') {
                      child.ref.child('/Pledges/' + pledgeName).set({
                        merits: 200
                      });
                    }
                    else if (child.val().status === 'pipm') {
                      child.ref.child('/Pledges/' + pledgeName).set({
                        merits: 'Unlimited'
                      });
                    }
                    else if (child.val().status !== 'pledge') {
                      child.ref.child('/Pledges/' + pledgeName).set({
                        merits: 100
                      });
                    }
                  });
                });
              }
              else {
                userRef.update({
                  status: 'active'
                });

                usersRef.once('value', (users) => {
                  users.forEach((child) => {
                    if (child.val().status === 'pledge') {
                      const pledgeName = child.key;

                      userRef.child('/Pledges/' + pledgeName).set({
                        merits: 100
                      });
                    }
                  });
                });
              }

              user.sendEmailVerification()
              .then(function() {
                res.status(200).send('Verification email has been sent.');
              });
            })
            .catch(function(error) {
              // Handle errors here.
              const errorCode = error.code;
              const errorMessage = error.message;

              console.log(errorCode, errorMessage);
              res.status(400).send('Something went wrong on the server.');
            });
          }
        })
        .catch(function(error) {
          // Handle errors here.
          const errorCode = error.code;
          const errorMessage = error.message;

          console.log(errorCode, errorMessage);
          res.status(400).send('Email has already been taken.');
        });
      }
    }
  });
});

// Forgot Password Route
app.post('/api/forgotPassword', function(req, res) {
  firebase.auth().sendPasswordResetEmail(req.body.email).then(function() {
    res.status(200).send('Email to reset password has been sent.');
  }).catch(function(error) {
    console.log(error);

    res.status(400).send('This email is not registered.');
  });
});

// Log Out Route
app.post('/api/logout', function(req, res) {
  firebase.auth().signOut()
  .then(function() {
    res.sendStatus(200);
  })
  .catch(function(error) {
    console.log(error);
    res.status(400).send(error);
  });
});

// Sets the user photo
app.post('/api/setPhoto', function(req, res) {
  const fullName = req.body.displayName;
  const userRef = admin.database().ref('/users/' + fullName);

  userRef.update({
    photoURL: req.body.url
  });

  // Sends back new user data with updated photo
  userRef.once('value', (user) => {
    res.json(user.val());
  });
});

// Get merits remaining for pledge
app.get('/api/meritsRemaining', function(req, res) {
  const { displayName, pledgeName } = req.params;
  const pledgeRef = admin.database().ref('/users/' + displayName + '/Pledges/' + pledgeName);

  pledgeRef.once('value', (active) => {
    res.json(active.val().merits);
  });
});

// Gets all the pledges for meriting as active
app.get('/api/pledgesForMerit', function(req, res) {
  const { displayName } = req.params;
  const pledgesRef = admin.database().ref('/users/' + displayName + '/Pledges');

  pledgesRef.once('value', (snapshot) => {
    let pledges = [];

    if (snapshot.val()) {
      pledges = Object.keys(snapshot.val()).map(function(key) {
        return {'value': key,
                'label': key.replace(/([a-z])([A-Z])/, '$1 $2'),
                'meritsRemaining': snapshot.val()[key].merits
               };
      });
    }

    res.json(pledges);
  });
});

// Gets all the actives for meriting as pledge
app.get('/api/activesForMerit', function(req, res) {
  const { displayName } = req.params;
  const usersRef = admin.database().ref('/users');

  usersRef.once('value', (snapshot) => {
    let actives = [];

    snapshot.forEach((active) => {
      if (active.val().status !== 'alumni' && active.val().status !== 'pledge') {
        actives.push({
          'value': active.key,
          'label': `${active.val().firstName} ${active.val().lastName}`,
          'meritsRemaining': active.val().Pledges[displayName].merits
        });
      }
    });

    res.json(actives);
  });
});

// Gets all the alumni for meriting as pledge
app.get('/api/alumniForMerit', function(req, res) {
  const { displayName } = req.params;
  const usersRef = admin.database().ref('/users');

  usersRef.once('value', (snapshot) => {
    let alumni = [];

    snapshot.forEach((alumnus) => {
      if (alumnus.val().status === 'alumni') {
        alumni.push({
          'value': alumnus.key,
          'label': `${alumnus.val().firstName} ${alumnus.val().lastName}`,
          'meritsRemaining': alumnus.val().Pledges[displayName].merits
        });
      }
    });

    res.json(alumni);
  });
});

// Gets all the chalkboards for merit
app.get('/api/chalkboardsForMerit', function(req, res) {
  const { fullName } = req.params;
  const chalkboardsRef = admin.database().ref('/chalkboards');

  chalkboardsRef.once('value', (snapshot) => {
    let myChalkboards = [];

    if (snapshot.val()) {
      const chalkboards = Object.keys(snapshot.val()).map(function(key) {
        return snapshot.val()[key];
      });

      chalkboards.forEach((chalkboard) => {
        if (chalkboard.activeName === fullName) {
          myChalkboards.push({
            title: chalkboard.title,
            amount: chalkboard.amount
          });
        }
        else {
          if (chalkboard.attendees) {
            const attendees = Object.keys(chalkboard.attendees).map(function(key) {
              return chalkboard.attendees[key];
            });

            attendees.forEach((attendee) => {
              if (attendee.name === fullName) {
                myChalkboards.push({
                  title: chalkboard.title,
                  amount: chalkboard.amount
                });
              }
            });
          }
        }
      });
    }

    res.json(myChalkboards);
  });
});

// Get Pbros data for pledges
app.get('/api/getPbros', function(req, res) {
  let pbros = [];
  const { displayName } = req.params;
  const usersRef = admin.database().ref('/users');

  usersRef.once('value', (users) => {
    users.forEach((user) => {
      if (user.val().status === 'pledge' && user.key !== displayName) {
        pbros.push(user.val());
      }
    });

    res.json(pbros);
  });
});

// Post merit data as active
app.post('/api/meritAsActive', function(req, res) {
  let counter = 0;
  const selectedPledges = req.body.selectedPledges;

  selectedPledges.forEach((child) => {
    const fullName = req.body.displayName;
    const activeRef = admin.database().ref('/users/' + fullName + '/Pledges/' + child.value);
    const pledgeRef = admin.database().ref('/users/' + child.value);

    activeRef.once('value', (active) => {
      if (req.body.status !== 'pipm' && !req.body.isChalkboard && !req.body.isPCGreet) {
        const remainingMerits = active.val().merits - req.body.merit.amount;

        if (req.body.merit.amount > 0 && 
            remainingMerits < 0 && 
            !res.headersSent) {
          res.sendStatus(400).send(child.label);
        }
        else {
          activeRef.update({
            merits: remainingMerits
          });
        }
      }

      pledgeRef.once('value', (pledge) => {
        counter++;

        pledgeRef.update({
          totalMerits: pledge.val().totalMerits + req.body.merit.amount
        });

        pledge.ref.child('Merits').push(req.body.merit);

        if (!res.headersSent && counter === selectedPledges.length) {
          res.sendStatus(200);
        }
      });
    });
  })
});

// Post merit data as pledge
app.post('/api/meritAsPledge', function(req, res) {
  let counter = 0;
  const {
    displayName,
    selectedActives,
    merit,
    isChalkboard,
    isPCGreet
  } = req.body;
  const pledgeRef = admin.database().ref('/users/' + displayName);

  selectedActives.forEach((child) => {
    const activeRef = admin.database().ref('/users/' + child.value);

    activeRef.once('value', (active) => {
      const merit = {
        name: `${active.val().firstName} ${active.val().lastName}`,
        description: merit.description,
        amount: merit.amount,
        photoURL: active.val().photoURL,
        date: merit.date
      }

      if (active.val().status !== 'pipm' && !isChalkboard && !isPCGreet) {
        const remainingMerits = active.val().Pledges[displayName].merits - merit.amount;

        if (merit.amount > 0 && 
            remainingMerits < 0 && 
            !res.headersSent) {
          res.sendStatus(400).send(child.label);
        }
        else {
          const activePledgeRef = active.ref.child('/Pledges/' + displayName);

          activePledgeRef.update({
            merits: remainingMerits
          });
        }
      }

      pledgeRef.once('value', (pledge) => {
        counter++;

        pledge.ref.child('Merits').push(merit);

        if (!res.headersSent && counter === selectedActives.length) {
          pledgeRef.update({
            totalMerits: pledge.val().totalMerits + (merit.amount * selectedActives.length)
          });
          
          res.sendStatus(200);
        }
      });
    });
  });
});

// Removes merit as pledge
app.post('/api/removeMeritAsPledge', function(req, res) {
  const pledgeName = req.body.displayName;
  const activeName = req.body.merit.name.replace(/ /g,'');
  const pledgeRef = admin.database().ref('/users/' + pledgeName);
  const activeRef = admin.database().ref('/users/' + activeName + '/Pledges/' + pledgeName);

  pledgeRef.once('value', (pledge) => {
    pledgeRef.update({
      totalMerits: pledge.val().totalMerits - req.body.merit.amount
    });

    pledgeRef.child('Merits').once('value', (merits) => {
      merits.forEach((merit) => {
        if (equal(req.body.merit, merit.val())) {
          merit.ref.remove(() => {
            activeRef.once('value', (active) => {
              if (req.body.merit.description.lastIndexOf('Chalkboard:', 0) !== 0) {
                activeRef.update({
                  merits: active.val().merits + req.body.merit.amount
                });
              }

              res.sendStatus(200);
            });
          });
        }
      });
    });
  });
});

// Gets the chalkboard information
app.get('/api/chalkboardInfo', function(req, res) {
  const { title } = req.params;
  const chalkboardsRef = admin.database().ref('/chalkboards');

  // Searches for the chalkboard by checking title
  chalkboardsRef.once('value', (chalkboards) => {
    chalkboards.forEach((chalkboard) => {
      if (title === chalkboard.val().title) {
        res.json({
          chalkboard: chalkboard.val()
        });
      }
    });
  });
});

// Retrieves all the attendees of the chalkboard
app.get('/api/attendees', function(req, res) {
  const { title } = req.params
  const chalkboardsRef = admin.database().ref('/chalkboards');

  chalkboardsRef.once('value', (chalkboards) => {
    chalkboards.forEach((chalkboard) => {
      // Looks for the chalkboard in the chalkboards ref
      if (title === chalkboard.val().title) {
        chalkboard.ref.child('attendees').once('value', (attendees) => {
          let attendeesArray = [];

          // Finds the attendees if there are any
          if (attendees.val()) {
            attendeesArray = Object.keys(attendees.val()).map(function(key) {
              return attendees.val()[key];
            });
          }

          res.json(attendeesArray);
        });
      }
    });
  });
});

// Creates a chalkboard
app.post('/api/createChalkboard', function(req, res) {
  const chalkboardInfo = {
    displayName: req.body.displayName,
    activeName: req.body.activeName,
    photoURL: req.body.photoURL,
    title: req.body.title,
    description: req.body.description,
    date: req.body.date,
    time: req.body.time,
    location: req.body.location,
    timeCommitment: req.body.timeCommitment,
    amount: req.body.amount
  };
  let chalkboardsRef = admin.database().ref('/chalkboards');
  let counter = 0;

  // Adds chalkboards to general chalkboards and user's chalkboards
  chalkboardsRef.once('value', (chalkboards) => {
    if (chalkboards.val()) {
      chalkboards.forEach((chalkboard) => {
        counter++;

        if (req.body.title === chalkboard.val().title) {
          res.sendStatus(400);
        }
        else {
          if (!res.headersSent && counter === chalkboards.numChildren()) {
            chalkboardsRef.push(chalkboardInfo);

            res.sendStatus(200);
          }
        }
      });
    }
    else {
      chalkboardsRef.push(chalkboardInfo);

      res.sendStatus(200);
    }
  });
});

// Edits chalkboard for desktop
app.post('/api/editChalkboard', function(req, res) {
  const chalkboardsRef = admin.database().ref('/chalkboards');

  chalkboardsRef.once('value', (chalkboards) => {
    chalkboards.forEach((chalkboard) => {
      // Looks for the chalkboard in the chalkboards ref
      if (req.body.chalkboard.title === chalkboard.val().title) {
        // Updates the chalkboard
        chalkboard.ref.update({
          description: req.body.description,
          date: req.body.date,
          time: req.body.time,
          location: req.body.location,
          timeCommitment: req.body.timeCommitment,
          amount: req.body.amount
        });

        res.sendStatus(200);
      }
    });
  });
});

// Edits chalkboard for mobile devices
app.post('/api/editChalkboardMobile', function(req, res) {
  const editedField = req.body.field.toLowerCase();
  const chalkboardsRef = admin.database().ref('/chalkboards');

  chalkboardsRef.once('value', (chalkboards) => {
    chalkboards.forEach((chalkboard) => {
      // Looks for the chalkboard in the chalkboards ref
      if (req.body.chalkboard.title === chalkboard.val().title) {
        // Updates the chalkboard
        chalkboard.ref.update({
          [editedField]: req.body.value
        });

        res.sendStatus(200);
      }
    });
  });
});

// Joins chalkboard as an attendee
app.post('/api/joinChalkboard', function(req, res) {
  const chalkboardsRef = admin.database().ref('/chalkboards');

  chalkboardsRef.once('value', (chalkboards) => {
    chalkboards.forEach((chalkboard) => {
      // Looks for the chalkboard in the chalkboards ref
      if (req.body.chalkboard.title === chalkboard.val().title) {
        // Adds the user to the Attendees ref
        chalkboard.ref.child('attendees').push({
          name: req.body.name,
          photoURL: req.body.photoURL
        });
        
        res.sendStatus(200);
      }
    });
  });
});

// Removes chalkboard from both user's list and general list
app.post('/api/removeChalkboard', function(req, res) {
  const chalkboardsRef = admin.database().ref('/chalkboards');

  chalkboardsRef.once('value', (chalkboards) => {
    chalkboards.forEach((chalkboard) => {
      // Removes chalkboard in the chalkboards ref
      if (req.body.chalkboard.title === chalkboard.val().title) {
        chalkboard.ref.remove(() => {
          res.sendStatus(200);
        });
      }
    });
  });
});

// Leaves chalkboard as an attendee
app.post('/api/leaveChalkboard', function(req, res) {
  const name = req.body.name;
  const chalkboardsRef = admin.database().ref('/chalkboards');

  chalkboardsRef.once('value', (chalkboards) => {
    chalkboards.forEach((chalkboard) => {
      // Looks for the chalkboard in the chalkboards ref
      if (req.body.chalkboard.title === chalkboard.val().title) {
        chalkboard.ref.child('attendees').once('value', (attendees) => {
          attendees.forEach((attendee) => {
            // Checks if the user is an attendee
            if (equal(name, attendee.val().name)) {
              // Removes user from the Attendees list
              attendee.ref.remove(() => {
                res.sendStatus(200);
              });
            }
          });
        });
      }
    });
  });
});

// Gets all the pledges for complaints
app.get('/api/pledgesForComplaints', function(req, res) {
  const usersRef = admin.database().ref('/users');

  // Loop through all users for pledges
  usersRef.once('value', (users) => {
    let pledgeArray = [];

    if (users.val()) {
      users.forEach((child) => {
        if (child.val().status === 'pledge') {
          pledgeArray.push(child.val());
        }
      });

      // Save the value, label, and photoURL for each pledge
      pledgeArray = pledgeArray.map(function(pledge) {
        return {'value': pledge.firstName + pledge.lastName, 
                'label': `${pledge.firstName} ${pledge.lastName}`,
                'photoURL': pledge.photoURL
               };
      });
    }

    res.json(pledgeArray);
  });
});

// Post complaint data
app.post('/api/complain', function(req, res) {
  // Check if active is PI/PM or not
  if (req.body.status !== 'pipm') {
    let complaintsRef = admin.database().ref('/pendingComplaints');

    // Add complaints to active's pending complaints list and the pending complaints list
    complaintsRef.push(req.body.complaint);
  }
  else {
    const pledgeName = req.body.complaint.pledgeDisplayName;
    let complaintsRef = admin.database().ref('/approvedComplaints');
    let pledgeComplaintsRef = admin.database().ref('/users/' + pledgeName + '/Complaints');

    // Add complaints to the approved complaints list and the specified pledge's complaints list
    complaintsRef.push(req.body.complaint);

    pledgeComplaintsRef.push(req.body.complaint);
  }

  res.sendStatus(200);
});

// Removes complaint for active
app.post('/api/removeComplaint', function(req, res) {
  const pendingComplaintsRef = admin.database().ref('/pendingComplaints');

  pendingComplaintsRef.once('value', (complaints) => {
    complaints.forEach((complaint) => {
      // Removes complaint from the pending complaints list
      if (equal(req.body.complaint, complaint.val())) {
        complaint.ref.remove(() => {
          res.sendStatus(200);
        });
      }
    });
  });
});

// Approves complaint for PI/PM
app.post('/api/approveComplaint', function(req, res) {
  const pledgeName = req.body.complaint.pledgeDisplayName;
  let pledgeComplaintsRef = admin.database().ref('/users/' + pledgeName + '/Complaints');
  let approvedComplaintsRef = admin.database().ref('/approvedComplaints');
  const pendingComplaintsRef = admin.database().ref('/pendingComplaints');

  pendingComplaintsRef.once('value', (complaints) => {
    complaints.forEach((complaint) => {
      // Removes complaint from the pending complaints list
      if (equal(req.body.complaint, complaint.val())) {
        complaint.ref.remove(() => {
          // Adds complaint to the approved complaints list
          approvedComplaintsRef.push(req.body.complaint);
          // Adds complaint to the pledge's complaints list
          pledgeComplaintsRef.push(req.body.complaint);

          res.sendStatus(200);
        });
      }
    });
  });
});

// Save message token from server
app.post('/api/saveMessageToken', function(req, res) {
  const fullName = req.body.displayName;
  const userRef = admin.database().ref('/users/' + fullName);

  userRef.update({
    registrationToken: req.body.token
  });

  res.sendStatus(200);
});

// Send active merit notification to pledges
app.post('/api/sendActiveMeritNotification', function(req, res) {
  const pledges = req.body.pledges;
  let counter = 0;
  let merits;

  if (req.body.amount > 0) {
    merits = 'merits';
  }
  else {
    merits = 'demerits';
  }

  pledges.forEach((pledge) => {
    const pledgeRef = admin.database().ref('/users/' + pledge.value);

    pledgeRef.once('value', (snapshot) => {
      const registrationToken = snapshot.val().registrationToken;
      const amount = Math.abs(req.body.amount);
      counter++;

      const message = {
        webpush: {
          notification: {
            title: 'Garnett',
            body: `You have received ${amount} ${merits} from ${pledge.label}.`,
            click_action: 'https://garnett-app.herokuapp.com/pledge-app',
            icon: 'https://farm5.staticflickr.com/4555/24846365458_2fa6bb5179.jpg',
            vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
          }
        },
        token: registrationToken
      };

      if (registrationToken) {
        admin.messaging().send(message)
        .then(function(response) {
          if (!res.headersSent && counter === pledges.length) {
            console.log("Successfully sent message:", response);
            res.sendStatus(200);
          }
        })
        .catch(function(error) {
          if (!res.headersSent && counter === pledges.length) {
            console.log("Error sending message:", error);
            res.sendStatus(400);
          }
        });
      }
      else {
        if (!res.headersSent && counter === pledges.length) {
          res.sendStatus(200);
        }
      }
    })
  });
});

// Send pledge merit notification to actives
app.post('/api/sendPledgeMeritNotification', function(req, res) {
  const actives = req.body.actives;
  let counter = 0;
  let merits;

  if (req.body.amount > 0) {
    merits = 'merits';
  }
  else {
    merits = 'demerits';
  }

  actives.forEach((active) => {
    const activeRef = admin.database().ref('/users/' + active.value);

    activeRef.once('value', (snapshot) => {
      const registrationToken = snapshot.val().registrationToken;
      const amount = Math.abs(req.body.amount);
      counter++;

      const message = {
        webpush: {
          notification: {
            title: 'Garnett',
            body: `You have given ${amount} ${merits} to ${req.body.pledgeName}.`,
            click_action: 'https://garnett-app.herokuapp.com/pledge-app',
            icon: 'https://farm5.staticflickr.com/4555/24846365458_2fa6bb5179.jpg',
            vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
          }
        },
        token: registrationToken
      };

      if (registrationToken) {
        admin.messaging().send(message)
        .then(function(response) {
          if (!res.headersSent && counter === actives.length) {
            console.log("Successfully sent message:", response);
            res.sendStatus(200);
          }
        })
        .catch(function(error) {
          if (!res.headersSent && counter === actives.length) {
            console.log("Error sending message:", error);
            res.sendStatus(400);
          }
        });
      }
      else {
        if (!res.headersSent && counter === actives.length) {
          res.sendStatus(200);
        }
      }
    })
  });
});

// Send created chalkboard notification to pledges
app.post('/api/sendCreatedChalkboardNotification', function(req, res) {
  const usersRef = admin.database().ref('/users');
  let counter = 0;

  usersRef.once('value', (users) => {
    users.forEach((user) => {
      if (user.val().status !== 'alumni') {
        const registrationToken = user.val().registrationToken;
        counter++;

        const message = {
          webpush: {
            notification: {
              title: 'Garnett',
              body: `New Chalkboard: ${req.body.chalkboardTitle}.`,
              click_action: 'https://garnett-app.herokuapp.com/pledge-app',
              icon: 'https://farm5.staticflickr.com/4555/24846365458_2fa6bb5179.jpg',
              vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
            }
          },
          token: registrationToken
        };

        if (registrationToken) {
          admin.messaging().send(message)
          .then(function(response) {
            if (!res.headersSent) {
              console.log("Successfully sent message:", response);
              res.sendStatus(200);
            }
          })
          .catch(function(error) {
            if (!res.headersSent) {
              console.log("Error sending message:", error);
              res.sendStatus(400);
            }
          });
        }
        else {
          if (!res.headersSent) {
            res.sendStatus(200);
          }
        }
      }
    });
  });
});

// Send edited chalkboard notification to attendees
app.post('/api/sendEditedChalkboardNotification', function(req, res) {
  const chalkboard = req.body.chalkboard;
  const chalkboardsRef = admin.database().ref('/chalkboards');

  chalkboardsRef.once('value', (chalkboards) => {
    chalkboards.forEach((child) => {
      if (equal(chalkboard, child.val())) {
        child.ref.child('attendees').once('value', (attendees) => {
          attendees.forEach((attendee) => {
            const attendeeName = attendee.val().name.replace(/ /g,'');
            const attendeeRef = admin.database().ref('/users/' + attendeeName);

            attendeeRef.once('value', (snapshot) => {
              const registrationToken = snapshot.val().registrationToken;
              const message = {
                webpush: {
                  notification: {
                    title: 'Garnett',
                    body: `${chalkboard.activeName} has edited the chalkboard, ${chalkboard.title}.`,
                    click_action: 'https://garnett-app.herokuapp.com/pledge-app',
                    icon: 'https://farm5.staticflickr.com/4555/24846365458_2fa6bb5179.jpg',
                    vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
                  }
                },
                token: registrationToken
              };

              if (registrationToken) {
                admin.messaging().send(message)
                .then(function(response) {
                  if (!res.headersSent) {
                    console.log("Successfully sent message:", response);
                    res.sendStatus(200);
                  }
                })
                .catch(function(error) {
                  if (!res.headersSent) {
                    console.log("Error sending message:", error);
                    res.sendStatus(400);
                  }
                });
              }
              else {
                if (!res.headersSent) {
                  res.sendStatus(200);
                }
              }
            });
          });
        });
      }
    });
  });
});

function sendAttendeesNotification(chalkboard, message, res) {
  const chalkboardsRef = admin.database().ref('/chalkboards');

  chalkboardsRef.once('value', (chalkboards) => {
    chalkboards.forEach((child) => {
      if (equal(chalkboard, child.val())) {
        child.ref.child('attendees').once('value', (attendees) => {
          attendees.forEach((attendee) => {
            const attendeeName = attendee.val().name.replace(/ /g,'');
            const attendeeRef = admin.database().ref('/users/' + attendeeName);

            attendeeRef.once('value', (snapshot) => {
              const registrationToken = snapshot.val().registrationToken;

              if (registrationToken) {
                admin.messaging().send(message)
                .then(function(response) {
                  if (!res.headersSent) {
                    console.log("Successfully sent message:", response);
                    res.sendStatus(200);
                  }
                })
                .catch(function(error) {
                  if (!res.headersSent) {
                    console.log("Error sending message:", error);
                    res.sendStatus(400);
                  }
                });
              }
              else {
                if (!res.headersSent) {
                  res.sendStatus(200);
                }
              }
            });
          });
        });
      }
    });
  });
}

// Send joined chalkboard notification to active
app.post('/api/sendJoinedChalkboardNotification', function(req, res) {
  const chalkboard = req.body.chalkboard;
  const activeName = chalkboard.displayName;
  const name = req.body.name;
  const activeRef = admin.database().ref('/users/' + activeName);

  activeRef.once('value', (active) => {
    const registrationToken = active.val().registrationToken;
    const message = {
      webpush: {
        notification: {
          title: 'Garnett',
          body: `${name} has joined the chalkboard, ${chalkboard.title}.`,
          click_action: 'https://garnett-app.herokuapp.com/pledge-app',
          icon: 'https://farm5.staticflickr.com/4555/24846365458_2fa6bb5179.jpg',
          vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
        }
      },
      token: registrationToken
    };

    if (registrationToken) {
      admin.messaging().send(message)
      .then(function(response) {
        if (!res.headersSent) {
          console.log("Successfully sent message:", response);
          res.sendStatus(200);
          sendAttendeesNotification(chalkboard, message, res);
        }
      })
      .catch(function(error) {
        if (!res.headersSent) {
          console.log("Error sending message:", error);
          res.sendStatus(400);
        }
      });
    }
    else {
      if (!res.headersSent) {
        res.sendStatus(200);
        sendAttendeesNotification(chalkboard, message, res);
      }
    }
  });
});

// Send left chalkboard notification to active
app.post('/api/sendLeftChalkboardNotification', function(req, res) {
  const chalkboard = req.body.chalkboard;
  const activeName = chalkboard.displayName;
  const name = req.body.name;
  const activeRef = admin.database().ref('/users/' + activeName);

  activeRef.once('value', (active) => {
    const registrationToken = active.val().registrationToken;
    const message = {
      webpush: {
        notification: {
          title: 'Garnett',
          body: `${name} has left the chalkboard, ${chalkboard.title}.`,
          click_action: 'https://garnett-app.herokuapp.com/pledge-app',
          icon: 'https://farm5.staticflickr.com/4555/24846365458_2fa6bb5179.jpg',
          vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
        }
      },
      token: registrationToken
    };

    if (registrationToken) {
      admin.messaging().send(message)
      .then(function(response) {
        if (!res.headersSent) {
          console.log("Successfully sent message:", response);
          res.sendStatus(200);
          sendAttendeesNotification(chalkboard, message, res);
        }
      })
      .catch(function(error) {
        if (!res.headersSent) {
          console.log("Error sending message:", error);
          res.sendStatus(400);
        }
      });
    }
    else {
      if (!res.headersSent) {
        res.sendStatus(200);
        sendAttendeesNotification(chalkboard, message, res);
      }
    }
  });
});

// Send complaint notification to pipm
app.post('/api/sendPendingComplaintNotification', function(req, res) {
  const complaint = req.body.complaint;
  const usersRef = admin.database().ref('/users');

  usersRef.once('value', (users) => {
    users.forEach((user) => {
      if (user.val().status === 'pipm') {
        const registrationToken = user.val().registrationToken;
        const message = {
          webpush: {
            notification: {
              title: 'Garnett',
              body: `A complaint has been submitted for ${complaint.pledgeName}.`,
              click_action: 'https://garnett-app.herokuapp.com/pledge-app',
              icon: 'https://farm5.staticflickr.com/4555/24846365458_2fa6bb5179.jpg',
              vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
            }
          },
          token: registrationToken
        };

        if (registrationToken) {
          admin.messaging().send(message)
          .then(function(response) {
            if (!res.headersSent) {
              console.log("Successfully sent message:", response);
              res.sendStatus(200);
            }
          })
          .catch(function(error) {
            if (!res.headersSent) {
              console.log("Error sending message:", error);
              res.sendStatus(400);
            }
          });
        }
        else {
          if (!res.headersSent) {
            res.sendStatus(200);
          }
        }
      }
    });
  });
});

// Send complaint notification to pledge
app.post('/api/sendApprovedComplaintNotification', function(req, res) {
  const complaint = req.body.complaint;
  const pledgeRef = admin.database().ref('/users/' + complaint.pledgeDisplayName);

  pledgeRef.once('value', (pledge) => {
    const registrationToken = pledge.val().registrationToken;
    const message = {
      webpush: {
        notification: {
          title: 'Garnett',
          body: 'You have received a complaint.',
          click_action: 'https://garnett-app.herokuapp.com/pledge-app',
          icon: 'https://farm5.staticflickr.com/4555/24846365458_2fa6bb5179.jpg',
          vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
        }
      },
      token: registrationToken
    };

    if (registrationToken) {
      admin.messaging().send(message)
      .then(function(response) {
        console.log("Successfully sent message:", response);
        res.sendStatus(200);
      })
      .catch(function(error) {
        console.log("Error sending message:", error);
        res.sendStatus(400);
      });
    }
    else {
      res.sendStatus(200);
    }
  });
});

// Update interaction for rushee
app.post('/api/updateInteraction', function(req, res) {
  const rusheeName = req.body.rusheeName;
  const displayName = req.body.displayName;
  const rusheeRef = admin.database().ref('/rushees/' + rusheeName);
  const activeRef = rusheeRef.child('Actives/' + displayName);
  let totalInteractions = req.body.totalInteractions;

  if (!req.body.interacted == true) {
    totalInteractions++;
  }
  else {
    totalInteractions--;
  }

  rusheeRef.update({
    totalInteractions: totalInteractions
  });

  activeRef.update({
    interacted: !req.body.interacted
  });

  res.sendStatus(200);
});

// Start vote for rushee
app.post('/api/startVote', function(req, res) {
  const delibsRef = admin.database().ref('/delibsVoting');

  delibsRef.update({
    open: true,
    rushee: req.body.rusheeName
  });

  res.sendStatus(200);
});

// End vote for rushee
app.post('/api/endVote', function(req, res) {
  const delibsRef = admin.database().ref('/delibsVoting');

  delibsRef.update({
    open: false,
    rushee: false
  });

  res.sendStatus(200);
});

// Voting for rushee
app.post('/api/vote', function(req, res) {
  const rusheeName = req.body.rushee.replace(/ /g,'');
  const fullName = req.body.displayName;
  const rusheeRef = admin.database().ref('/rushees/' + rusheeName);
  const activeRef = admin.database().ref('/rushees/' + rusheeName + '/Actives/' + fullName);
  let vote;

  activeRef.once('value', (active) => {
    if (active.val().vote === 'yes') {
      if (req.body.vote === 'yes') {
        vote = 0;
      }
      else {
        vote = -1;
      }
    }
    else {
      if (req.body.vote === 'yes') {
        vote = 1;
      }
      else {
        vote = 0;
      } 
    }

    rusheeRef.once('value', (rushee) => {
      const votes = rushee.val().votes + vote;

      if (active.val().voted === false) {
        rusheeRef.update({
          totalVotes: rushee.val().totalVotes + 1
        });
        activeRef.update({
          voted: true
        });
      }

      rusheeRef.update({
        votes: votes
      });
      activeRef.update({
        vote: req.body.vote
      });

      res.sendStatus(200);
    });
  });
});

// Get photo for data app
app.get('/api/photos', function(req, res) {
  const { data: namesMap } = req.params;
  let photoMap = new Map();

  namesMap.forEach((set) => {
    [...new Map(set[1])].forEach((entry) => {
      photoMap.set(entry[0], 0);
    });
  });

  let max = photoMap.size;
  photoMap.clear();
  
  namesMap.forEach((set) => {
    [...new Map(set[1])].forEach((entry) => {
      if (photoMap.get(entry[0]) === undefined) {
        const name = entry[0].replace(/ /g,'');;
        const userRef = admin.database().ref('/users/' + name);

        userRef.once('value', (user) => {
          photoMap.set(entry[0], user.val().photoURL);

          if (photoMap.size === max) {
            res.json([...photoMap]);
          }
        });
      }
    });
  });
});

// Get my data for data app
app.get('/api/myData', function(req, res) {
  const { fullName } = req.params;
  const usersRef = admin.database().ref('/users');
  const chalkboardsRef = admin.database().ref('/chalkboards');

  usersRef.once('value', (users) => {
    let totalMeritInstances = 0;
    let meritInstances = 0;
    let demeritInstances = 0;
    let totalMeritAmount = 0;
    let meritAmount = 0;
    let demeritAmount = 0;

    users.forEach((user) => {
      if (user.val().status === 'pledge') {
        let merits = Object.keys(user.val().Merits).map(function(key) {
          return user.val().Merits[key];
        });

        merits.forEach((merit) => {
          if (merit.name === fullName) {
            if (merit.amount > 0) {
              meritInstances += 1;
              meritAmount += merit.amount;
            }
            else {
              demeritInstances += 1;
              demeritAmount += merit.amount;
            }

            totalMeritInstances += 1;
            totalMeritAmount += merit.amount;
          }
        });
      }
    });

    chalkboardsRef.once('value', (chalkboards) => {
      let chalkboardsCreated = 0;
      let chalkboardsAttended = 0;

      chalkboards.forEach((chalkboard) => {
        if (chalkboard.val().activeName === fullName) {
          chalkboardsCreated += 1;
        }
        else {
          let attendees = Object.keys(chalkboard.val().attendees).map(function(key) {
            return chalkboard.val().attendees[key];
          });

          attendees.forEach((attendee) => {
            if (attendee.name === fullName) {
              chalkboardsAttended += 1;
            }
          });
        }
      });

      res.json([
        ['Total Merit Instances', totalMeritInstances],
        ['Merit Instances', meritInstances],
        ['Demerit Instances', demeritInstances],
        ['Total Merit Amount', totalMeritAmount],
        ['Merit Amount', meritAmount],
        ['Demerit Amount', demeritAmount],
        ['Chalkboards Created', chalkboardsCreated],
        ['Chalkboards Attended', chalkboardsAttended],
      ]);
    });
  });
});

app.listen(port, function () {
  console.log('Example app listening on port 4000!')
});

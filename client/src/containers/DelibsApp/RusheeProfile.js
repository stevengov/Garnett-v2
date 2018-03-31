import './DelibsApp.css';
import '../PledgeApp/PledgeApp.css';
import '../../components/Settings/Settings.css';
import {loadFirebase} from '../../helpers/functions.js';
import {LoadingRusheeProfile} from '../../helpers/loaders.js';
import API from '../../api/API.js';

import React, {Component} from 'react';
import Loadable from 'react-loadable';
import Snackbar from 'material-ui/Snackbar';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';

const LoadableEndVoteDialog = Loadable({
  loader: () => import('./EndVoteDialog'),
  render(loaded, props) {
    let Component = loaded.default;
    return <Component {...props}/>;
  },
  loading() {
    return <div></div>;
  }
});

const LoadableVoteDialog = Loadable({
  loader: () => import('./VoteDialog'),
  render(loaded, props) {
    let Component = loaded.default;
    return <Component {...props}/>;
  },
  loading() {
    return <div></div>;
  }
});

const LoadableResumeDialog = Loadable({
  loader: () => import('./ResumeDialog'),
  render(loaded, props) {
    let Component = loaded.default;
    return <Component {...props}/>;
  },
  loading() {
    return <div></div>;
  }
});

export default class RusheeProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      rushee: null,
      openResume: false,
      openSnackbar: false,
      message: ''
    };
  }

  componentWillMount() {
    let rusheeName = this.props.history.location.state;

    if (!this.props.history.location.state) {
      this.props.history.push('/delibs-app');
    }

    if (navigator.onLine) {
      loadFirebase('database')
      .then(() => {
        let firebase = window.firebase;
        let rusheesRef = firebase.database().ref('/rushees/' + rusheeName);

        rusheesRef.on('value', (snapshot) => {
          this.setState({
            rushee: snapshot.val()
          });
        });
      });
    }
  }

  startVote = () => {
    let rusheeName = `${this.state.rushee.firstName} ${this.state.rushee.lastName}`;

    API.startVote(rusheeName)
    .then((res) => {
      console.log('Started Vote');
      this.setState({
        open: true
      });
    })
    .catch((error) => {
      console.log('Error: ', error);
    });
  }

  handleClose = () => {
    this.setState({
      open: false
    });
  }

  viewResume = () => {
    // Handles android back button
    let path;
    if (process.env.NODE_ENV === 'development') {
      path = 'http://localhost:3000';
    }
    else {
      path = 'https://garnett-app.herokuapp.com';
    }

    window.history.pushState(null, null, path + window.location.pathname);
    window.onpopstate = () => {
      window.history.pushState(null, null, path + window.location.pathname);
      this.closeResume();
    }

    this.setState({
      openResume: true
    });
  }

  closeResume = () => {
    window.onpopstate = () => {};
    this.setState({
      openResume: false
    });
  }

  handleRequestOpen = (message) => {
    this.setState({
      openSnackbar: true,
      message: message
    });
  }

  handleRequestClose = () => {
    this.setState({
      openSnackbar: false
    });
  }

  render() {
    return (
      this.state.rushee ? (
        <div className="loading-container">
          <div className="app-header">
            <span> Rushee Profile </span>
            <span className="back-home" onClick={this.props.history.goBack}> Back </span>
          </div>

          <div className="rushee-profile-container animate-in">
            <img className="user-photo" src={this.state.rushee.photo} alt="User" />
            <List>
              <Divider />
              <ListItem
                className="garnett-list-item settings"
                primaryText="Name"
                secondaryText={`${this.state.rushee.firstName} ${this.state.rushee.lastName}`}
              />
              <Divider />
              <ListItem
                className="garnett-list-item settings"
                primaryText="Phone Number"
                secondaryText={this.state.rushee.phone}
              />
              <Divider />
              <ListItem
                className="garnett-list-item settings"
                primaryText="Email Address"
                secondaryText={this.state.rushee.email}
              />
              <Divider />
              <ListItem
                className="garnett-list-item settings"
                primaryText="Year"
                secondaryText={this.state.rushee.year}
              />
              <Divider />
              <ListItem
                className="garnett-list-item settings"
                primaryText="Graduation Year"
                secondaryText={this.state.rushee.graduationYear}
              />
              <Divider />
              <ListItem
                className="garnett-list-item settings"
                primaryText="Major"
                secondaryText={this.props.state.major}
              />
              <Divider className="garnett-divider last" />
            </List>

            {this.props.state.status === 'regent' ? (
              <div>
                <div className="logout-button" onClick={this.startVote}> Start Vote </div>

                <LoadableEndVoteDialog
                  open={this.state.open}
                  rushee={`${this.state.rushee.firstName} ${this.state.rushee.lastName}`}
                  handleClose={this.handleClose}
                  handleRequestOpen={this.handleRequestOpen}
                />
              </div>
            ) : (
              <div>
                <div className="logout-button" onClick={this.viewResume}> View Resume </div>
                
                <LoadableResumeDialog
                  open={this.state.openResume}
                  resume={this.state.rushee.resume}
                  handleClose={this.closeResume}
                />
                <LoadableVoteDialog
                  state={this.props.state}
                  handleRequestOpen={this.handleRequestOpen}
                />
              </div>
            )}
          </div>

          <Snackbar
            open={this.state.openSnackbar}
            message={this.state.message}
            autoHideDuration={4000}
            onRequestClose={this.handleRequestClose}
          />
        </div>
      ) : (
        <LoadingRusheeProfile />
      )
    )
  }
}
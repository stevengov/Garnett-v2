import '../Chalkboards.css';
import API from '../../../api/API.js';
import {getTabStyle, isMobileDevice, mapsSelector} from '../../../helpers/functions.js';

import React, {Component} from 'react';
import Loadable from 'react-loadable';
import Dialog from 'material-ui/Dialog';
import {Tabs, Tab} from 'material-ui/Tabs';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import FullscreenDialog from 'material-ui-fullscreen-dialog';

const inkBarStyle = {
  position: 'fixed',
  bottom: 'auto',
  marginTop: '46px',
  backgroundColor: 'var(--primary-color)',
  zIndex: 2
};

const LoadableAttendeeList = Loadable({
  loader: () => import('./AttendeeList'),
  render(loaded, props) {
    let Component = loaded.default;
    return <Component {...props}/>;
  },
  loading() {
    return <div> Loading... </div>;
  }
});

let LoadableEditChalkboardDialog;

if (isMobileDevice()) {
  LoadableEditChalkboardDialog = Loadable({
    loader: () => import('./EditChalkboardMobileDialog'),
    render(loaded, props) {
      let Component = loaded.default;
      return <Component {...props}/>;
    },
    loading() {
      return <div> Loading... </div>;
    }
  });
}
else {
  LoadableEditChalkboardDialog = Loadable({
    loader: () => import('./EditChalkboardDialog'),
    render(loaded, props) {
      let Component = loaded.default;
      return <Component {...props}/>;
    },
    loading() {
      return <div> Loading... </div>;
    }
  });
}

export default class HandleChalkboardDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chalkboard: null,
      open: false,
      field: '',
      index: 0
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      chalkboard: nextProps.chalkboard,
      index: nextProps.index
    });
  }

  // Joins the chalkboard
  join = (chalkboard) => {
    let name = this.props.state.name;
    let photoURL = this.props.state.photoURL;

    API.joinChalkboard(name, photoURL, chalkboard)
    .then((res) => {
      console.log('Joined chalkboard');
      this.props.handleClose();
      this.props.handleRequestOpen(`Joined ${chalkboard.title}`);
    })
    .catch((error) => {
      console.log('Error: ', error);
      this.props.handleClose();
      this.props.handleRequestOpen('Error joining chalkboard');
    });
  }

  // Removes the chalkboard
  remove = (chalkboard) => {
    let displayName = this.props.state.displayName;

    API.removeChalkboard(displayName, chalkboard)
    .then((res) => {
      console.log('Removed chalkboard');
      this.props.handleClose();
      this.props.handleRequestOpen(`Removed ${chalkboard.title}`);
    })
    .catch((error) => {
      console.log('Error: ', error);
      this.props.handleClose();
      this.props.handleRequestOpen('Error removing chalkboard');
    });
  }

  // Leaves the chalkboard
  leave = (chalkboard) => {
    let name = this.props.state.name;

    API.leaveChalkboard(name, chalkboard)
    .then((res) => {
      console.log('Left chalkboard');
      this.props.handleClose();
      this.props.handleRequestOpen(`Left ${chalkboard.title}`);
    })
    .catch((error) => {
      console.log('Error: ', error);
      this.props.handleClose();
      this.props.handleRequestOpen('Error leaving chalkboard');
    });
  }

  // Updates the chalkboard information displayed
  updateChalkboardInfo = () => {
    API.getChalkboardInfo(this.state.chalkboard.title)
    .then((res) => {
      this.setState({
        chalkboard: res.data.chalkboard
      });
    })
    .catch((error) => {
      console.log('Error: ', error);
    });
  }

  // Updates the navigation tab index
  handleChange = (value) => {
    this.setState({
      index: value
    });
  }

  // Opens the edit dialog if user is hosting chalkboard
  handleEditOpen = (field) => {
    if (this.props.type === 'hosting') {
      // Handles android back button for edit dialog
      if (/android/i.test(navigator.userAgent)) {
        let path;
        if (process.env.NODE_ENV === 'development') {
          path = 'http://localhost:3000';
        }
        else {
          path = 'https://garnett-app.herokuapp.com';
        }

        window.history.pushState(null, null, path + window.location.pathname);
        window.onpopstate = () => {
          this.handleEditClose();
        }
      }

      this.setState({
        open: true,
        field: field
      });
    }
  }

  // Closes the edit dialog
  handleEditClose = () => {
    // Handles android back button for this dialog
    if (/android/i.test(navigator.userAgent)) {
      let path;
      if (process.env.NODE_ENV === 'development') {
        path = 'http://localhost:3000';
      }
      else {
        path = 'https://garnett-app.herokuapp.com';
      }

      window.history.pushState(null, null, path + window.location.pathname);
      window.onpopstate = () => {
        this.handleClose();
      }
    }

    this.setState({
      open: false,
      field: ''
    });
  }

  // Closes this dialog
  handleClose = () => {
    if (/android/i.test(navigator.userAgent)) {
      window.onpopstate = () => {};
    }

    this.props.handleClose();

    this.setState({
      index: 0
    });
  }

  render() {
    let label;

    if (this.props.type === 'upcoming') {
      label = 'Join';
    }
    else if (this.props.type === 'attending') {
      label = 'Leave';
    }
    else {
      label = 'Remove';
    }

    const actions = [
      <FlatButton
        label="Close"
        primary={true}
        onClick={this.handleClose}
      />,
      this.props.type !== 'completed' && (
        <RaisedButton
          label={label}
          primary={true}
          onClick={() => {
            if (this.props.type === 'upcoming') {
              this.join(this.state.chalkboard);
            }
            else if (this.props.type === 'attending') {
              this.leave(this.state.chalkboard);
            }
            else {
              this.remove(this.state.chalkboard);
            }
          }}
        />
      ),
    ];

    const actionButton = (
      this.props.type !== 'completed' ? (
        <FlatButton
          label={label}
          primary={true}
          onClick={() => {
            if (this.props.type === 'upcoming') {
              this.join(this.state.chalkboard);
            }
            else if (this.props.type === 'attending') {
              this.leave(this.state.chalkboard);
            }
            else {
              this.remove(this.state.chalkboard);
            }
          }}
        />
      ) : (
        <div></div>
      )
    )

    return (
      this.state.chalkboard && (
        <div>
          {isMobileDevice() ? (
            <FullscreenDialog
              title="Chalkboard"
              actionButton={actionButton}
              open={this.props.open}
              onRequestClose={this.handleClose}
            >
              <Tabs 
                className="garnett-dialog-tabs"
                inkBarStyle={inkBarStyle}
                onChange={this.handleChange}
              >
                <Tab style={getTabStyle(this.state.index === 0)} label="Information" value={0}>
                  <img className="chalkboard-photo" src={this.state.chalkboard.photoURL} alt="User" />
                  <List style={{padding:'24px 0'}}>
                    <Divider />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Title"
                      secondaryText={this.state.chalkboard.title}
                      leftIcon={
                        <i className="icon-info-circled garnett-icon"></i>
                      }
                    />
                    <Divider className="garnett-divider" inset={true} />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Active Name"
                      secondaryText={this.state.chalkboard.activeName}
                      leftIcon={
                        <i className="icon-user garnett-icon"></i>
                      }
                    />
                    <Divider className="garnett-divider" inset={true} />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Description"
                      secondaryText={this.state.chalkboard.description}
                      leftIcon={
                        <i className="icon-list-alt garnett-icon"></i>
                      }
                      onClick={() => this.handleEditOpen('Description')}
                    />
                    <Divider className="garnett-divider" inset={true} />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Date"
                      secondaryText={this.state.chalkboard.date}
                      leftIcon={
                        <i className="icon-calendar-check-o garnett-icon"></i>
                      }
                      onClick={() => this.handleEditOpen('Date')}
                    />
                    <Divider className="garnett-divider" inset={true} />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Time"
                      secondaryText={this.state.chalkboard.time}
                      leftIcon={
                        <i className="icon-clock garnett-icon"></i>
                      }
                      onClick={() => this.handleEditOpen('Time')}
                    />
                    <Divider className="garnett-divider" inset={true} />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Location"
                      secondaryText={this.state.chalkboard.location}
                      leftIcon={
                        <i className="icon-location garnett-icon"></i>
                      }
                      onClick={() => {
                        if (this.props.type === 'hosting') {
                          this.handleEditOpen('Location');
                        }
                        else {
                          mapsSelector(this.state.chalkboard.location);
                        }
                      }}
                    />
                    <Divider className="garnett-divider" />
                  </List>
                </Tab>
                <Tab style={getTabStyle(this.state.index === 1)} label="Attendees" value={1}>
                  <LoadableAttendeeList chalkboard={this.state.chalkboard} />
                </Tab>
              </Tabs>
            </FullscreenDialog>
          ) : (
            <Dialog
              title={this.props.type === 'hosting' ? (
                <div>
                  <span> Chalkboard </span>
                  <i 
                    className="icon-edit edit-chalkboard"
                    onClick={this.handleEditOpen}
                  >
                  </i>
                </div>
              ) : (
                <span> Chalkboard </span>
              )}
              titleClassName="garnett-dialog-title"
              actions={actions}
              modal={false}
              bodyClassName="garnett-dialog-body tabs grey"
              contentClassName="garnett-dialog-content"
              open={this.props.open}
              onRequestClose={this.handleClose}
              autoScrollBodyContent={true}
            >
              <Tabs 
                className="garnett-dialog-tabs"
                inkBarStyle={inkBarStyle}
                onChange={this.handleChange}
              >
                <Tab style={getTabStyle(this.state.index === 0)} label="Information" value={0}>
                  <List style={{padding:'24px 0'}}>
                    <Divider />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Title"
                      secondaryText={this.state.chalkboard.title}
                      leftIcon={
                        <i className="icon-info-circled garnett-icon"></i>
                      }
                    />
                    <Divider className="garnett-divider" inset={true} />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Active Name"
                      secondaryText={this.state.chalkboard.activeName}
                      leftIcon={
                        <i className="icon-user garnett-icon"></i>
                      }
                    />
                    <Divider className="garnett-divider" inset={true} />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Description"
                      secondaryText={this.state.chalkboard.description}
                      leftIcon={
                        <i className="icon-list-alt garnett-icon"></i>
                      }
                    />
                    <Divider className="garnett-divider" inset={true} />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Date"
                      secondaryText={this.state.chalkboard.date}
                      leftIcon={
                        <i className="icon-calendar-check-o garnett-icon"></i>
                      }
                    />
                    <Divider className="garnett-divider" inset={true} />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Time"
                      secondaryText={this.state.chalkboard.time}
                      leftIcon={
                        <i className="icon-clock garnett-icon"></i>
                      }
                    />
                    <Divider className="garnett-divider" inset={true} />
                    <ListItem
                      className="garnett-list-item"
                      primaryText="Location"
                      secondaryText={this.state.chalkboard.location}
                      leftIcon={
                        <i className="icon-location garnett-icon"></i>
                      }
                      onClick={() => {
                        mapsSelector(this.state.chalkboard.location);
                      }}
                    />
                    <Divider className="garnett-divider" />
                  </List>
                </Tab>
                <Tab style={getTabStyle(this.state.index === 1)} label="Attendees" value={1}>
                  <LoadableAttendeeList chalkboard={this.state.chalkboard} />
                </Tab>
              </Tabs>
            </Dialog>
          )}

          <LoadableEditChalkboardDialog
            open={this.state.open}
            state={this.props.state}
            field={this.state.field}
            chalkboard={this.state.chalkboard}
            updateChalkboardInfo={this.updateChalkboardInfo}
            handleClose={this.handleEditClose}
            handleRequestOpen={this.props.handleRequestOpen}
          />
        </div>
      )
    )
  }
}

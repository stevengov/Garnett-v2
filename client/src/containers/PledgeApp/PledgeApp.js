import './PledgeApp.css';
import { loadFirebase, androidBackOpen, androidBackClose } from 'helpers/functions';
import {
  LoadableContacts,
  LoadableSettings
} from 'helpers/LoadableComponents';
import { MyMerits } from 'containers/PledgeApp-v2/components/MyMerits/MyMerits';
import { Pledges } from 'containers/PledgeApp-v2/components/Pledges/Pledges';
import { Navbar } from './components/Navbar';

import React, { PureComponent } from 'react';

export default class PledgeApp extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      title: 'Merits',
      index: 0,
      totalMerits: 0,
      previousTotalMerits: 0,
      openMerit: false
    };
  }

  componentDidMount() {
    console.log(`Pledge app mount: ${this.props.state.name}`)
    localStorage.setItem('route', 'pledge-app');

    if (navigator.onLine) {
      loadFirebase('database')
      .then(() => {
        const { firebase } = window;
        const { displayName } = this.props.state;
        const userRef = firebase.database().ref('/users/' + displayName);

        userRef.on('value', (user) => {
          const { totalMerits } = user.val();

          localStorage.setItem('totalMerits', totalMerits);
          this.setState({
            totalMerits: totalMerits,
            previousTotalMerits: this.state.totalMerits
          });
        });
      });
    }
  }

  handleChange = (index) => {
    this.setState({ index })
  };

  handleMeritOpen = () => {
    if (navigator.onLine) {
      androidBackOpen(this.handleMeritClose);
      this.setState({
        openMerit: true
      });
    }
    else {
      this.props.handleRequestOpen('You are offline');
    }
  }

  handleMeritClose = () => {
    androidBackClose();
    this.setState({
      openMerit: false
    });
  }

  render() {
    return (
      <div className="content-container">
        <MyMerits
          totalMerits={this.state.totalMerits}
          previousTotalMerits={this.state.previousTotalMerits}
          openMerit={this.state.openMerit}
          state={this.props.state}
          handleMeritOpen={this.handleMeritOpen}
          handleMeritClose={this.handleMeritClose}
          handleRequestOpen={this.props.handleRequestOpen}
          hidden={this.state.index !== 0}
        />
        <Pledges
          state={this.props.state}
          hidden={this.state.index !== 1}
        />
        <LoadableContacts
          state={this.props.state}
          actives={this.state.activeArray}
          hidden={this.state.index !== 2}
        />
        <LoadableSettings
          state={this.props.state} 
          logoutCallBack={this.props.logoutCallBack} 
          history={this.props.history}
          hidden={this.state.index !== 3}
        />
        <Navbar
          status={this.props.state.status}
          index={this.state.index}
          handleChange={this.handleChange}
        />
      </div>
    )
  }
}
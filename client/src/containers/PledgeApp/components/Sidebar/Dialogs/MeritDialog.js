// @flow

import './MeritDialog.css';
import { SelectUsers } from './SelectUsers';
import { CreateAmount } from './CreateAmount';
import type { User, MeritType } from 'api/models';

import React, { Component, type Node } from 'react';
import FullscreenDialog from 'material-ui-fullscreen-dialog';

const fullscreenDialogStyle = {
  backgroundColor: 'var(--background-color)'
};

const appBarStyle = {
  backgroundColor: 'var(--background-color)'
};

type Props = {
  state: User,
  open: boolean,
  handleMeritClose: () => void,
  handleRequestOpen: () => void
};

type State = {
  type: MeritType,
  users: Array<User>,
  description: string,
  date: string
};

export default class MeritDialog extends Component<Props, State> {
  state = {
    type: 'personal',
    users: [],
    description: '',
    date: ''
  };

  get body(): Node {
    const { state, handleRequestOpen } = this.props;
    return (
      <div id="merit-dialog-container">
        <SelectUsers
          state={state}
          type={this.state.type}
          description={this.state.description}
          setUsers={this.setUsers}
          setDescription={this.setDescription}
          setDate={this.setDate}
          handleRequestOpen={handleRequestOpen}
        />
        <CreateAmount
          state={state}
          users={this.state.users}
          description={this.state.description}
          date={this.state.date}
          setType={this.setType}
          setDescription={this.setDescription}
          handleClose={this.handleClose}
          handleRequestOpen={handleRequestOpen}
        />
      </div>
    )
  }

  // Sets state from SelectUsers
  setUsers = (users: Array<User>) => this.setState({ users });
  setDescription = (description: string) => this.setState({ description});
  setDate = (date: string) => this.setState({ date });
  // Sets state from CreateAmount
  setType = (type: MeritType) => this.setState({ type });

  handleClose = () => {
    this.props.handleMeritClose();
    this.setState({
      type: 'personal',
      users: [],
      description: ''
    });
  }

  render() {
    return (
      <FullscreenDialog
        appBarStyle={appBarStyle}
        style={fullscreenDialogStyle}
        open={this.props.open}
        onRequestClose={this.handleClose}
        appBarZDepth={0}
      >
        { this.body }
      </FullscreenDialog>
    )
  }
}

import React, {Component} from 'react';
import Loadable from 'react-loadable';
import Avatar from 'material-ui/Avatar';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';

// const LoadableApprovechalkboardDialog = Loadable({
//   loader: () => import('./ApprovechalkboardDialog'),
//   render(loaded, props) {
//     let Component = loaded.default;
//     return <Component {...props}/>;
//   },
//   loading() {
//     return <div> Loading... </div>;
//   }
// });

export default class MyChalkboards extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      selectedchalkboard: null
    };
  }

  handleOpen = (chalkboard) => {
    if (navigator.onLine) {
      this.setState({
        open: true,
        selectedchalkboard: chalkboard
      });
    }
    else {
      this.handleRequestOpen('You are offline.');
    }
  }

  handleClose = () => {
    this.setState({
      open: false
    });
  }

  render() {
    return (
      <div id="my-chalkboards" className="active">
        <List className="pledge-list">
          {this.props.state.status !== 'pledge' && (
            <div>
              <Subheader> Hosting </Subheader>
              {this.props.myHostingChalkboards.map((chalkboard, i) => (
                <div key={i}>
                  <Divider className="pledge-divider large" inset={true} />
                  <ListItem
                    className="pledge-list-item large"
                    leftAvatar={<Avatar className="pledge-image" size={70} src={chalkboard.photoURL} />}
                    primaryText={
                      <p className="pledge-name"> {chalkboard.title} </p>
                    }
                    secondaryText={
                      <p className="chalkboards-description">
                        {chalkboard.description}
                      </p>
                    }
                    secondaryTextLines={2}
                  >
                    <p className="chalkboards-date"> {chalkboard.date} </p>
                  </ListItem>
                  <Divider className="pledge-divider large" inset={true} />
                </div>
              ))}

              <Divider />
            </div>
          )}

          <Subheader> Attending </Subheader>
          {this.props.myAttendingChalkboards.map((chalkboard, i) => (
            <div key={i}>
              <Divider className="pledge-divider large" inset={true} />
              <ListItem
                className="pledge-list-item large"
                leftAvatar={<Avatar className="pledge-image large" size={70} src={chalkboard.photoURL} />}
                primaryText={
                  <p className="pledge-name"> {chalkboard.title} </p>
                }
                secondaryText={
                  <p className="chalkboards-description">
                    {chalkboard.description}
                  </p>
                }
                secondaryTextLines={2}
              >
                <p className="chalkboards-date"> {chalkboard.date} </p>
              </ListItem>
              <Divider className="pledge-divider large" inset={true} />
            </div>
          ))}

          <Divider />

          <Subheader> Completed </Subheader>
          {this.props.myCompletedChalkboards.map((chalkboard, i) => (
            <div key={i}>
              <Divider className="pledge-divider large" inset={true} />
              <ListItem
                className="pledge-list-item large"
                leftAvatar={<Avatar className="pledge-image large" size={70} src={chalkboard.photoURL} />}
                primaryText={
                  <p className="pledge-name"> {chalkboard.title} </p>
                }
                secondaryText={
                  <p className="chalkboards-description">
                    {chalkboard.description}
                  </p>
                }
                secondaryTextLines={2}
                onClick={() => {
                  if (this.props.state.status !== 'active') {
                    this.handleApproveOpen(chalkboard)
                  }
                }}
              >
                <p className="chalkboards-date"> {chalkboard.date} </p>
              </ListItem>
              <Divider className="pledge-divider large" inset={true} />
            </div>
          ))}
        </List>
      </div>
    )
  }
}

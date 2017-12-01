import React, {Component} from 'react';
import Avatar from 'material-ui/Avatar';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';

export default class ActiveList extends Component {
  componentDidMount() {
    let height = document.getElementById('past-complaints').clientHeight;
    let screenHeight = window.innerHeight - 157;

    if (height < screenHeight) {
      document.getElementById('past-complaints').style.height = 'calc(100vh - 157px)';
    }
  }

  render() {
    return (
      <div id="past-complaints">
        <List className="pledge-list">
          {this.props.complaintsArray.map((complaint, i) => (
            <div key={i}>
              <Divider className="pledge-divider large" inset={true} />
              <ListItem
                className="pledge-list-item large"
                leftAvatar={<Avatar className="pledge-image large" size={70} src={complaint.photoURL} />}
                primaryText={
                  <p className="pledge-name"> {complaint.pledgeName} </p>
                }
                secondaryText={
                  <p className="complaints-description">
                    {complaint.description}
                  </p>
                }
                secondaryTextLines={2}
              >
                <p className="complaints-date"> {complaint.date} </p>
              </ListItem>
              <Divider className="pledge-divider large" inset={true} />
            </div>
          ))}
        </List>
      </div>
    )
  }
}
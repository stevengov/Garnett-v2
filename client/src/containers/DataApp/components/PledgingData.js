// @flow

import API from 'api/API.js';
import goldMedal from './images/gold.png';
import silverMedal from './images/silver.png';
import bronzeMedal from './images/bronze.png';
import { LoadingComponent } from 'helpers/loaders.js';
import { ToggleViewHeader } from 'components';

import React, { PureComponent, type Node } from 'react';
import Avatar from 'material-ui/Avatar';
import { ListItem } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';

const VIEW_OPTIONS = [
  { view: 'actives', label: 'Actives' },
  { view: 'pledges', label: 'Pledges' }
];

type State = {
  displayedData: ?Array<any>,
  activeData: ?Array<any>,
  pledgeData: ?Array<any>,
  photoMap: ?Array<any>,
  view: 'actives' | 'pledges' | null
};

export class PledgingData extends PureComponent<{}, State> {
  state = {
    displayedData: null,
    activeData: null,
    pledgeData: null,
    photoMap: null,
    view: null
  }

  componentDidMount() {
    API.getPledgingData()
    .then((res) => {
      const { activeData, pledgeData, photoMap } = res.data;
      const view = localStorage.getItem('pledgingDataView') || 'actives';
      const displayedData = view === 'actives' ? activeData : pledgeData;
      this.setState({
        displayedData,
        activeData,
        pledgeData,
        photoMap: new Map(photoMap),
        view
      });
    });
  }

  dataValue(dataValue: string): Node {
    const instances = dataValue[0];
    const amount = dataValue[1];
    let color = '';

    if (amount > 0) {
      color = 'green';
    } else if (amount < 0) {
      color = 'red';
    }

    return (
      <div className="data-value-container">
        <p className="data-instance">{ instances } instances</p>
          <p className={`data-amount ${color}`}>
            { amount > 0 && '+' }{ amount }
          </p>
      </div>
    )
  }

  medal(index: number): ?Node {
    switch (index) {
      case 0:
        return <img className="medal" src={goldMedal} alt="Gold medal" />;
      case 1:
        return <img className="medal" src={silverMedal} alt="Silver medal" />;
      case 2:
        return <img className="medal" src={bronzeMedal} alt="Bronze medal" />;
      default:
    }
  }

  setView = (value: string) => {
    let displayedData;
    switch (value) {
      case 'actives':
        displayedData = this.state.activeData;
        break;
      case 'pledges':
        displayedData = this.state.pledgeData;
        break;
      default:
    }
    localStorage.setItem('pledgingDataView', value);
    this.setState({ displayedData, view: value });
  };

  render() {
    const { displayedData, photoMap, view } = this.state;

    if (!displayedData) {
      return <LoadingComponent />
    }

    return (
      <div id="pledging-data-container">
        <ToggleViewHeader
          className="garnett-subheader toggle-view"
          viewOptions={VIEW_OPTIONS}
          view={view}
          setView={this.setView}
        />

        {displayedData.map((set, i) => (
          <div className="data-card" key={i}>
            <Subheader className="garnett-subheader">
              { set[0] }
            </Subheader>
            {set[1].map((entry, j) => (
              <div key={j}>
                <Divider className="garnett-divider" inset={true} />
                <ListItem
                  className="garnett-list-item"
                  leftAvatar={
                    <Avatar
                      className="garnett-image"
                      size={60}
                      src={photoMap.get(entry[0])}
                    />
                  }
                  primaryText={<p className="data-key">{ entry[0] }</p>}
                >
                  { this.medal(j) }
                  { this.dataValue(entry[1]) }
                </ListItem>
                <Divider className="garnett-divider pledge-data" inset={true} />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }
}

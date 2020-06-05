import React from 'react';
import logo from './logo.jpg';
import {Toolbar, ToolbarRow, ToolbarSection, ToolbarTitle} from '@rmwc/toolbar';
import './Toolbar.css';

export default ({title, userName, roomName}) => (
  <Toolbar>
    <ToolbarRow>
      <ToolbarSection alignStart>
        <img src={logo} alt="eyeson Logo" className="Toolbar-logo" height={50} />
        <ToolbarTitle>{title}</ToolbarTitle>
      </ToolbarSection>
      {(userName && roomName)
      && (
          <ToolbarSection alignEnd>
            <div className={'ToolbarButton'}>
              {userName}
            </div>
            <div className={'ToolbarButton'}>
              {roomName}
            </div>
          </ToolbarSection>
      )}
    </ToolbarRow>
  </Toolbar>
);

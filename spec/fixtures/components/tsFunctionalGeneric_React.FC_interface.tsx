import * as React from 'react';
import styled from 'styled-components';

interface TProps {
  onAssignClick: () => void;
  onCreateClick: () => void;
}

const StartCollaborate: React.FC<TProps> = ({
  onAssignClick,
  onCreateClick,
}) => (
  <div onClick={onAssignClick} onDblClick={onCreateClick}>
   test
  </div>
);

export default React.memo(StartCollaborate);
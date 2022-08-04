import * as React from 'react';
import * as PropTypes from 'prop-types';

export const userInfo = {
  contactId: PropTypes.string,
  isOpen: PropTypes.bool,
};

export type UserInfoProps = PropTypes.InferProps<typeof userInfo>;

const UserInfo: React.FC<UserInfoProps> = ({
  contactId,
  isOpen = false,
}) => {
  return (
    <p>User Info: {contactId} {isOpen}</p>
  );
};

export default UserInfo;

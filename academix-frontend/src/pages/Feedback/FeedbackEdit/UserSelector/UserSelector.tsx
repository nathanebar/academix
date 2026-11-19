// src/pages/Feedback/FeedbackEdit/UserSelector/UserSelector.tsx
import React, { useCallback } from 'react';
import style from '../FeedbackForm/FeedbackForm.module.css';
import { Select, ConfigProvider, Space } from 'antd';

import { CheckOutlined } from '@ant-design/icons';
import Photo from '../../../../UI/Photo/Photo';

interface User {
  id: number;
  name: string;
  email: string;
}

interface FormDataItem {
  userId: number | null;
  userName: string;
  userEmail: string | null;
  militaryid: string;
  hasUserAnswered: boolean;
}

interface UserSelectorProps {
  selectedUserId: number | null;
  setSelectedUserId: (userId: number | null) => void;
  uniqueUsers: User[];
  userTaskAssignment: FormDataItem | undefined;
  hasUserAnswered?: boolean;
}

const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUserId,
  setSelectedUserId,
  uniqueUsers,
  userTaskAssignment,
  hasUserAnswered = false
}) => {
  const handleUserChange = useCallback((value: string) => {
    setSelectedUserId(value ? Number(value) : null);
  }, [setSelectedUserId]);

  return (
    <div className={style.userSelector}>
      <Photo
        username={userTaskAssignment?.userName}
        style={{
          width: "2.5rem",
          height: "2.5rem",
          cursor: "pointer"
        }}
      />
      <div className={style.userInfo}>
        <span className={style.userName}>
          {userTaskAssignment?.userName || 'No user selected'}
        </span>
      </div>
      
      <div className={style.userInfo}>
        <span className={style.userName}>
          {userTaskAssignment?.militaryid || 'No user selected'}
        </span>
      </div>
      
      <div className={style.userNavigationContainer}>
        <ConfigProvider theme={{
          components: {
            Select: {
              borderRadius: 50,
              colorBgContainer: '#f4f1eb',
              colorText: '#5e6366',
              colorBorder: '#ced4da'
            }
          }
        }}>
          <Select
            id="userSelect"
            value={selectedUserId?.toString() || ''}
            onChange={handleUserChange}
            className={style.select}
            dropdownClassName={style.selectDropdown}
          >
            {uniqueUsers.map((user) => (
              <Select.Option key={user.id} value={user.id.toString()}>
                {user.name}
              </Select.Option>
            ))}
          </Select>
        </ConfigProvider>
      </div>
      

    </div>
  );
};

export default React.memo(UserSelector);
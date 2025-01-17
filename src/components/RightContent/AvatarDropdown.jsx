import React, { useCallback, useState } from 'react';
import { LogoutOutlined, SettingOutlined, UserOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import { Avatar, Menu, Spin, notification } from 'antd';
import { history, useModel, useIntl, useRequest  } from 'umi';
import { stringify } from 'querystring';
import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';
import { outLoginUsingPOST as outLogin } from '@/services/swagger1/userController';
import CookieUtil from '../../utils/CookieUtil';
/**
 * 退出登录，并且将当前的 url 保存
 */
const loginOut = async () => {
  await outLogin();
  const { query = {}, pathname } = history.location;
  const { redirect } = query; // Note: There may be security issues, please note
  if (window.location.pathname !== '/user/login' && !redirect) {
    history.replace({
      pathname: '/user/login',
      search: stringify({
        redirect: pathname,
      }),
    });
  }
  window.location.reload();
};
const AvatarDropdown = ({ menu }) => {
  const intl = useIntl();
  const { initialState, setInitialState } = useModel('@@initialState');
  if (!initialState) {
    return loading;
  }
  const onMenuClick = (event) =>{
    const key = event.key;
    if (key === 'logout' && initialState) {
      setInitialState({ ...initialState, currentUser: undefined });
      loginOut();
      return;
    }else if (key === 'stopExport' && initialState) {
      if(initialState.ws!=null){
        initialState.ws.send("EXPORT_INTERRUPT");
      }
      return;
    }else if (key === 'fetchJobs' && initialState) {
      if(initialState.ws!=null){
        initialState.ws.send("FETCH_JOBS");
      }
      return;
    }else if (key === 'addJob' && initialState) {
      if(initialState.ws!=null){
        initialState.ws.send("EXPORT_START");
      }
      return;
    }
    else{
      history.push('/account/settings');
    }
  }
  const loading = (
    <span className={`${styles.action} ${styles.account}`}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );



  const { currentUser } = initialState;

  if (!currentUser || !currentUser.name) {
    return loading;
  }

  const menuHeaderDropdown = (
    <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
      <Menu.Item key="logout">
        <LogoutOutlined />
        {intl.formatMessage({
          id: 'menu.account.logout',
        })}
      </Menu.Item>
    </Menu>
  );
  return (
    <HeaderDropdown trigger={['click']} overlay={menuHeaderDropdown}>
      <span className={`${styles.action} ${styles.account}`}>
        <Avatar size="small" className={styles.avatar} icon={<UserOutlined />} style={{ backgroundColor: '#FC4C2F' }}  alt="avatar" />
        <span className={`${styles.name} anticon`}>{currentUser.name}</span>
      </span>
    </HeaderDropdown>
  );
};

export default AvatarDropdown;

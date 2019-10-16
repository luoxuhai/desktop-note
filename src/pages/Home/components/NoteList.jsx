import React, { Fragment, useState, useEffect } from 'react';
import { Icon, List, Modal, Button, Timeline } from 'antd';
import { connect } from 'dva';
import Dexie from 'dexie';
import { promises as fs } from 'fs';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { remote } from 'electron';
import OperateRecord from './OperateRecord';
import styles from './NoteList.less';

const db = new Dexie('note');
db.version(1).stores({
  users: 'userId, userName, password, avatar, note',
});

moment.locale('zh-cn');

export default connect(({ edit, login }) => ({
  ...edit,
  ...login,
}))(
  ({ collapsed, onOpenNote, onDeleteNote, onAddNote, onExportToPdf, notes, dispatch, userId }) => {
    const [isShareVisible, setIsShareVisible] = useState(false);
    const [recordVisible, setRecordVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [point, setPoint] = useState({ top: 0, left: 0 });
    const share = ['QQ', '微信', '微博', '贴吧'];

    const getNotes = () => {
      db.users
        .get({
          userId,
        })
        .then(user => {
          if (user && typeof user.notes === 'object') {
            dispatch({
              type: 'edit/changeNotes',
              payload: {
                notes: user.notes,
                userId,
              },
            });
          }
        });

      document.querySelector('.ant-list').addEventListener(
        'contextmenu',
        e => {
          e.preventDefault();
          setPoint({ top: e.pageY + 10, left: e.pageX + 10 });
          setVisible(true);
        },
        false,
      );
    };

    useEffect(getNotes, []);

    const handleMouseEnter = path => {
      dispatch({
        type: 'edit/changeCurrentNote',
        payload: path,
      });
      setVisible(false);
    };

    const handleCloseMenu = () => {
      setVisible(false);
    };

    const handleOpenShareModal = () => {
      setVisible(false);
      setIsShareVisible(true);
    };

    const handleCancel = () => {
      setIsShareVisible(false);
      setRecordVisible(false);
    };

    const handleOpenTimeline = () => {
      setVisible(false);
      setRecordVisible(true);
    };

    const handleShare = index => {
      const shares = [
        'http://wpa.qq.com/msgrd?v=3&uin=2639415619',
        'https://wx.qq.com/',
        'https://m.weibo.cn/login?backURL=https%3A%2F%2Fm.weibo.cn%2Fdetail%2F4427447095001282',
        'https://passport.baidu.com/v2/?reg&tpl=tb&u=https://tieba.baidu.com/index.html?traceid=#',
      ];
      setIsShareVisible(false);
      window.open(shares[index]);
    };

    return (
      <Fragment>
        <Button
          style={{ marginTop: 10 }}
          onClick={onAddNote}
          type="primary"
          icon="plus-circle"
          block
          size="large"
        >
          新建
        </Button>
        <List
          className={styles.listWrapper}
          dataSource={notes}
          bordered
          renderItem={item => (
            <List.Item
              className={styles.listItem}
              key={item.title}
              style={{ padding: collapsed ? 6 : '' }}
              onClick={() => onOpenNote(item.path)}
              onMouseEnter={() => handleMouseEnter(item.path)}
              onFocus={() => null}
            >
              <p className={styles.icon}>{collapsed ? item.title : ''}</p>
              <List.Item.Meta
                className={styles.listItemMeta}
                title={collapsed ? '' : <p className={styles.title}>{item.title}</p>}
                description={
                  collapsed ? (
                    ''
                  ) : (
                    <p>
                      <Icon type="clock-circle" /> {item.updatedAt}
                    </p>
                  )
                }
              />
            </List.Item>
          )}
        />
        <ul className={styles.contextMenu} style={{ display: visible ? '' : 'none', ...point }}>
          <li className={styles.menuItem} onClick={onOpenNote}>
            打开 Ctrl+O
          </li>
          <li className={styles.menuItem} onClick={onOpenNote}>
            编辑 Ctrl+E
          </li>
          <li className={styles.menuItem} onClick={handleOpenTimeline}>
            操作记录 Ctrl+T
          </li>
          <li className={styles.menuItem} onClick={onExportToPdf}>
            导出为PDF
          </li>
          <li className={styles.menuItem} onClick={() => handleOpenShareModal()}>
            分享 Ctrl+S
          </li>
          {/* <li className={styles.menuItem} onClick={onDeleteNote}>
          删除 Ctrl+D
        </li> */}
        </ul>
        <div
          className={styles.mask}
          style={{ display: visible ? '' : 'none' }}
          onClick={handleCloseMenu}
        />
        <Modal
          title="请选择分享方式"
          visible={isShareVisible}
          onOk={handleCancel}
          onCancel={handleCancel}
        >
          {share.map((e, i) => (
            <Button
              key={i}
              onClick={() => handleShare(i)}
              style={{ margin: '0 20px' }}
              type="primary"
              size="large"
            >
              {e}
            </Button>
          ))}
        </Modal>
        <Modal title="操作记录" destroyOnClose visible={recordVisible} onOk={handleCancel} onCancel={handleCancel}>
          <OperateRecord onOpenNote={onOpenNote} onCancel={handleCancel} />
        </Modal>
      </Fragment>
    );
  },
);

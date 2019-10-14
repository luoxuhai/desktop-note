import React, { Fragment, useState, useEffect } from 'react';
import { Icon, List, notification } from 'antd';
import { connect } from 'dva';
import { promises as fs } from 'fs';
import moment from 'moment';
import { remote } from 'electron';
import styles from './NoteList.less';

moment.locale('zh-cn');

export default connect(({ edit }) => ({
  ...edit,
}))(({ collapsed, onOpenNote, currentNote, dispatch }) => {
  const [notes, setNotes] = useState([]);
  const [visible, setVisible] = useState(false);
  const [point, setPoint] = useState({ top: 0, left: 0 });

  const getNotes = () => {
    fs.readdir('./resource/notes')
      .then(res => {
        const note = res.reverse().map(e => ({
          title: e.slice(13, -5),
          updatedAt: moment()
            .utc(e.slice(0, 13), 'YYYYMMDDHHmmss')
            .format('MM月DD日-HH:mm:ss'),
          path: `./resource/notes/${e}`,
        }));
        dispatch({
          type: 'edit/changeCurrentNote',
          payload: note[0].path,
        });
        onOpenNote();
        setNotes(note);
      })
      .catch(err => {
        notification.error({
          message: '读取文件失败!',
          description: err,
        });
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
    setVisible(false);
    dispatch({
      type: 'edit/changeCurrentNote',
      payload: path,
    });
  };

  const handleCloseMenu = () => {
    setVisible(false);
  };

  const handleDeleteNote = () => {

  }

  return (
    <Fragment>
      <List
        className={styles.listWrapper}
        dataSource={notes}
        bordered
        renderItem={(item, index) => (
          <List.Item
            className={styles.listItem}
            key={item.title}
            style={{ padding: collapsed ? 6 : '' }}
            onClick={onOpenNote}
            onMouseEnter={() => handleMouseEnter(notes[index].path)}
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
        <li className={styles.menuItem} onClick={onOpenNote}>打开</li>
        <li className={styles.menuItem} onClick={onOpenNote}>编辑</li>
        <li className={styles.menuItem} onClick={() => handleDeleteNote()}>删除</li>
        <li className={styles.mask} onClick={handleCloseMenu} />
      </ul>
    </Fragment>
  );
});

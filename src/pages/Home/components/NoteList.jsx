import React, { Fragment, useState, useEffect } from 'react';
import { Button, Icon, List, notification } from 'antd';
import { promises as fs } from 'fs';
import moment from 'moment';
import { remote } from 'electron';
import styles from './NoteList.less';

const { Menu, MenuItem } = remote;

const menu = new Menu();
menu.append(
  new MenuItem({
    label: '打开',
    role: 'selectAll',
    accelerator: 'CmdOrCtrl+O',
  }),
);
menu.append(
  new MenuItem({
    label: '编辑',
    role: 'selectAll',
    accelerator: 'CmdOrCtrl+E',
  }),
);
menu.append(
  new MenuItem({
    label: '删除',
    role: 'selectAll',
    accelerator: 'delete',
  }),
);
moment.locale('zh-cn');

const NoteList = ({ collapsed, onOpenNote }) => {
  const [notes, setNotes] = useState([]);
  let currentNote = ''

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
        onOpenNote(note[0].path)
        setNotes(note);
      })
      .catch(err => {
        notification.error({
          message: '读取文件失败!',
          description: err,
        });
      });

    menu.append(
      new MenuItem({
        label: '打开',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          console.log(currentNote);
          onOpenNote(currentNote);
        },
      }),
    );

    document.querySelector('.ant-list').addEventListener(
      'contextmenu',
      e => {
        e.preventDefault();
        menu.popup({ window: remote.getCurrentWindow() });
      },
      false,
    );
  };

  useEffect(getNotes, []);

  const handleMouseEnter = path => {
    currentNote = path;
  };

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
            onClick={() => onOpenNote(notes[index].path)}
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
    </Fragment>
  );
};

export default NoteList;

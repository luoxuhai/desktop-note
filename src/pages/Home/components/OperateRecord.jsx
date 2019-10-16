import React, { Fragment, useState, useEffect } from 'react';
import { Icon, message, Timeline } from 'antd';
import { connect } from 'dva';
import { promises as fs } from 'fs';
import moment from 'moment';
import 'moment/locale/zh-cn';

moment.locale('zh-cn');

export default connect(({ edit, login }) => ({
  ...edit,
  ...login,
}))(({ currentNote, onOpenNote, onCancel }) => {
  const [records, setRecords] = useState([]);
  const getNotes = () => {
    fs.readdir(currentNote).then(res => {
      setRecords(
        res
          .map(e => ({
            record: e.split('.')[1],
            fileName: e,
            updatedAt: moment(Number(e.split('.')[0])).format('MM-DD HH:mm'),
          }))
          .reverse(),
      );
    });
  };

  useEffect(() => {
    getNotes();
  }, []);

  const handleOpenNote = fileName => {
    onOpenNote(`${currentNote}/${fileName}`, true);
    onCancel();
    message.success('已打开历史操作记录')
  };

  return (
    <Fragment>
      <Timeline mode="alternate">
        {records.map((e, i) =>
          (i === 0 ? (
            <Timeline.Item
              style={{ cursor: 'pointer' }}
              key={e.fileName}
              onClick={() => handleOpenNote(e.fileName)}
              color="red"
              dot={i === 0 && <Icon type="clock-circle-o" style={{ fontSize: '16px' }} />}
            >
              {e.updatedAt}
              <span style={{ fontWeight: 'bold', fontSize: 16 }}> {e.record}</span>
            </Timeline.Item>
          ) : (
            <Timeline.Item
              style={{ cursor: 'pointer' }}
              key={e.fileName}
              onClick={() => handleOpenNote(e.fileName)}
            >
              {e.updatedAt}
              <span style={{ fontWeight: 'bold', fontSize: 16 }}> {e.record}</span>
            </Timeline.Item>
          )),
        )}
      </Timeline>
    </Fragment>
  );
});

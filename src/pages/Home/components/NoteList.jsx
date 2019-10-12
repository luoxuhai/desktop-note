import React, { Fragment } from 'react';
import { Button, Result, List } from 'antd';
import styles from './NoteList.less';

const NoteList = ({ data, collapsed }) => (
  <Fragment>
    <List
      dataSource={data}
      renderItem={item => (
        <List.Item key={item.title}>
          <List.Item.Meta
            title={<a href="https://ant.design">{item.title}</a>}
            description={collapsed ? '' : item.title}
          />
        </List.Item>
      )}
    />
  </Fragment>
);

export default NoteList;

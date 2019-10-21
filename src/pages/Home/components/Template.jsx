import React, { Fragment, useState, useEffect } from 'react';
import { Tabs, Card } from 'antd';
import { connect } from 'dva';
import { promises as fs } from 'fs';

const subject = [
  '医学类',
  '哲学类',
  '经济学类',
  '法学',
  '教育学',
  '理学',
  '文学',
  '历史学',
  '工学',
  '农学',
];

const path = './resource/templates';

export default connect(({ edit, login }) => ({
  ...edit,
  ...login,
}))(({ onOpenTemplate, onCancel }) => {
  const [templates, setTemplates] = useState([]);
  const getNotes = async () => {
    const template = [];
    await Promise.all(
      subject.map(async e => {
        template.push(await fs.readdir(`${path}/${e}`));
      }),
    );
    setTemplates(template);
  };

  const handleSelectTemplate = _path => {
    onOpenTemplate(_path);
    onCancel();
  };

  useEffect(() => {
    getNotes();
  }, []);
  return (
    <Fragment>
      <Tabs defaultActiveKey="1" tabPosition="top">
        {subject.map((e, i) => (
          <Tabs.TabPane tab={e} key={e}>
            <Card>
              {templates.length &&
                templates[i].map(item => (
                  <Card.Grid
                    key={item}
                    style={{
                      width: '33.3%',
                      height: 110,
                      color: 'hsla(144, 51.4%, 52.4%, 100%)',
                      fontSize: 18,
                      textAlign: 'center',
                      display: 'WebkitBox',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                      overflow: 'hidden',
                    }}
                    onClick={() => handleSelectTemplate(`${path}/${subject[i]}/${item}`)}
                  >
                    {item.replace('.tem', '')}
                  </Card.Grid>
                ))}
            </Card>
          </Tabs.TabPane>
        ))}
      </Tabs>
    </Fragment>
  );
});

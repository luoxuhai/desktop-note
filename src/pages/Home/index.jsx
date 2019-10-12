import 'braft-editor/dist/index.css';
import 'braft-extensions/dist/color-picker.css';
import 'braft-extensions/dist/code-highlighter.css';
import React from 'react';
import BraftEditor from 'braft-editor';
import ColorPicker from 'braft-extensions/dist/color-picker';
import CodeHighlighter from 'braft-extensions/dist/code-highlighter';
import { Row, Col, Button, Layout, List, message, Avatar, Spin } from 'antd';
import styles from './index.less';
import NoteList from './components/NoteList';

// const { remote } = require('electron');

// const { Menu, MenuItem } = remote;

// const menu = new Menu();
// menu.append(
//   new MenuItem({
//     label: 'MenuItem1',
//     click() {
//       console.log('item 1 clicked');
//     },
//   }),
// );
// menu.append(new MenuItem({ type: 'separator' }));
// menu.append(new MenuItem({ label: 'MenuItem2', type: 'checkbox', checked: true }));

// window.addEventListener(
//   'contextmenu',
//   e => {
//     e.preventDefault();
//     menu.popup({ window: remote.getCurrentWindow() });
//   },
//   false,
// );

BraftEditor.use(
  ColorPicker({
    includeEditors: ['editor'],
    theme: 'light',
  }),
);

BraftEditor.use(
  CodeHighlighter({
    includeEditors: ['editor'],
  }),
);

class FormDemo extends React.Component {
  state = {
    editorState: BraftEditor.createEditorState(),
    collapsed: false,
    data: [
      {
        title: 'Ant Design Title 1',
      },
      {
        title: 'Ant Design Title 2',
      },
      {
        title: 'Ant Design Title 3',
      },
      {
        title: 'Ant Design Title 4',
      },
    ],
  };

  componentDidMount() {
    window.addEventListener('resize', () => {
      const controlbarH = document.querySelector('.bf-controlbar').clientHeight;
      document.querySelector('.bf-content').style.height = `calc(100vh - ${controlbarH}px)`;
    });
  }

  onCollapse = collapsed => {
    console.log(collapsed);
    this.setState({ collapsed });
  };

  handleChange = editorState => {
    this.setState({ editorState });
  };

  preview = () => {
    if (window.previewWindow) {
      window.previewWindow.close();
    }

    window.previewWindow = window.open();
    window.previewWindow.document.write(this.buildPreviewHtml());
    window.previewWindow.document.close();
  };

  buildPreviewHtml() {
    return `
      <!Doctype html>
      <html>
        <head>
          <title>Preview Content</title>
          <style>
            html,body{
              height: 100%;
              margin: 0;
              padding: 0;
              overflow: auto;
              background-color: #f1f2f3;
            }
            .container{
              box-sizing: border-box;
              width: 1000px;
              max-width: 100%;
              min-height: 100%;
              margin: 0 auto;
              padding: 30px 20px;
              overflow: hidden;
              background-color: #fff;
              border-right: solid 1px #eee;
              border-left: solid 1px #eee;
            }
            .container img,
            .container audio,
            .container video{
              max-width: 100%;
              height: auto;
            }
            .container p{
              white-space: pre-wrap;
              min-height: 1em;
            }
            .container pre{
              padding: 15px;
              background-color: #f1f1f1;
              border-radius: 5px;
            }
            .container blockquote{
              margin: 0;
              padding: 15px;
              background-color: #f1f1f1;
              border-left: 3px solid #d1d1d1;
            }
          </style>
        </head>
        <body>
          <div class="container">${this.state.editorState.toHTML()}</div>
        </body>
      </html>
    `;
  }

  render() {
    const extendControls = [
      {
        key: 'custom-button',
        type: 'button',
        text: '预览',
        onClick: this.preview,
      },
    ];

    const { collapsed, data } = this.state;

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Sider
          width={300}
          collapsible
          collapsed={collapsed}
          onCollapse={this.onCollapse}
          theme="light"
        >
          <NoteList collapsed={collapsed} data={data} />
        </Layout.Sider>
        <Layout>
          <Layout.Content style={{ margin: '0 16px' }}>
            <Row type="flex" justify="center">
              <Col span={24}>
                <BraftEditor
                  className="editor-wrapper"
                  id="editor"
                  onChange={this.handleChange}
                  extendControls={extendControls}
                  placeholder="输入内容"
                />
                {/* <Button size="large" type="primary" htmlType="submit">
                  提交
                </Button> */}
              </Col>
            </Row>
          </Layout.Content>
        </Layout>
      </Layout>
    );
  }
}

export default FormDemo;

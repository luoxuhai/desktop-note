import React from 'react';
import BraftEditor from 'braft-editor';
import ColorPicker from 'braft-extensions/dist/color-picker';
import CodeHighlighter from 'braft-extensions/dist/code-highlighter';
import { Row, Col, Button, Layout, List, message, Avatar, Spin, Icon, notification } from 'antd';
import uuidv4 from 'uuid/v4';
import styles from './index.less';
import NoteList from './components/NoteList';

const { remote } = require('electron');
const fs = require('fs').promises;

const { Menu, MenuItem } = remote;

const menu = new Menu();
menu.append(
  new MenuItem({
    label: '全选',
    role: 'selectAll',
    accelerator: 'CmdOrCtrl+A',
  }),
);

menu.append(
  new MenuItem({
    label: '复制',
    role: 'copy',
    accelerator: 'CmdOrCtrl+C',
  }),
);

menu.append(
  new MenuItem({
    label: '剪切',
    role: 'cut',
    accelerator: 'CmdOrCtrl+X',
  }),
);

menu.append(
  new MenuItem({
    label: '粘贴',
    role: 'paste',
    accelerator: 'CmdOrCtrl+V',
  }),
);

menu.append(
  new MenuItem({
    type: 'separator',
  }),
);

menu.append(
  new MenuItem({
    label: '撤销',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo',
  }),
);
menu.append(
  new MenuItem({
    label: '重做',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo',
  }),
);

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

let editorState = {};

class FormDemo extends React.Component {
  state = {
    collapsed: false,
    initEditorData: BraftEditor.createEditorState('<h1>加载中...</h1>'),
  };

  componentDidMount() {
    window.addEventListener('resize', () => {
      const controlbarH = document.querySelector('.bf-controlbar').clientHeight;
      document.querySelector('.bf-content').style.height = `calc(100vh - ${controlbarH}px)`;
    });

    document.querySelector('.bf-content').addEventListener(
      'contextmenu',
      e => {
        e.preventDefault();
        menu.popup({ window: remote.getCurrentWindow() });
      },
      false,
    );
  }

  componentDidUpdate() {
    const controlbarH = document.querySelector('.bf-controlbar').clientHeight;
    document.querySelector('.bf-content').style.height = `calc(100vh - ${controlbarH}px)`;
  }

  onCollapse = () => {
    const { collapsed } = this.state;
    this.setState({ collapsed: !collapsed });
  };

  handleChange = out => {
    editorState = out;
  };

  handleSaveByRAW = () => {
    // FIXME: 文件保存逻辑
    const fileName = uuidv4();
    fs.writeFile(`./resource/notes/${fileName}.raw`, editorState.toRAW())
      .then(() => {
        message.success('笔记保存成功!');
      })
      .then(async () => {
        let noteInfo = '';
        try {
          noteInfo = require('./resource/notes/noteInfo.json');
        } catch (err) {
          noteInfo = '';
        }

        if (noteInfo) {
          noteInfo = JSON.parse(noteInfo).notes.unshift({
            title: editorState.toRAW(true).blocks[0].text.slice(0, 20),
            updatedAt: Date.now(),
            fileName: `${fileName}.raw`,
          });
        }
        await fs.writeFile('./resource/notes/noteInfo.json', JSON.stringify(noteInfo, null, 2));
      })
      .catch(err => {
        notification.error({
          message: '保存笔记失败!',
          description: err,
        });
      });
  };

  handleOpenNote = path => {
    fs.readFile(path, { encoding: 'utf-8' }).then(res => {
      this.setState({ initEditorData: BraftEditor.createEditorState(res) });
    });
  };

  render() {
    const { collapsed, initEditorData } = this.state;

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Sider
          className={styles.sider}
          collapsedWidth={100}
          width={300}
          collapsible
          trigger={null}
          collapsed={collapsed}
          theme="light"
        >
          <NoteList collapsed={collapsed} onOpenNote={this.handleOpenNote} />
          <div className={styles.trigger} onClick={this.onCollapse}>
            <Icon type={collapsed ? 'right' : 'left'} />
          </div>
        </Layout.Sider>
        <Layout>
          <Layout.Content style={{ margin: '0 16px' }}>
            <Row type="flex" justify="center">
              <Col span={24}>
                <BraftEditor
                  className="editor-wrapper"
                  id="editor"
                  value={initEditorData}
                  onChange={this.handleChange}
                  placeholder="输入内容"
                />
              </Col>
            </Row>
          </Layout.Content>
        </Layout>
        <Button
          className={styles.floatButton}
          onClick={this.handleSaveByRAW}
          type="primary"
          shape="circle"
          icon="save"
        />
      </Layout>
    );
  }
}

export default FormDemo;

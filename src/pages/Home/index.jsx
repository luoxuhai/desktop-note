import React from 'react';
import BraftEditor from 'braft-editor';
import ColorPicker from 'braft-extensions/dist/color-picker';
import CodeHighlighter from 'braft-extensions/dist/code-highlighter';
import {
  Row,
  Col,
  Button,
  Layout,
  Dropdown,
  message,
  Avatar,
  Menu as AntdMenu,
  Icon,
  Tooltip,
  notification,
} from 'antd';
import { connect } from 'dva';
import uuidv4 from 'uuid/v4';
import html2pdf from 'html2pdf.js';
import router from 'umi/router';
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

@connect(({ edit, login }) => ({
  ...edit,
  ...login,
}))
class FormDemo extends React.Component {
  state = {
    collapsed: false,
    initEditorData: BraftEditor.createEditorState(''),
    isAddNote: true,
  };

  selectNote = null;

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

  handleOutLogin = () => {
    window.localStorage.removeItem('userId');
    router.replace('/user/login');
  };

  handleSaveByRAW = async () => {
    const { userId, dispatch } = this.props;
    const { isAddNote } = this.state;
    const path = `./resource/notes/${userId}`;
    const fileName = isAddNote ? `${uuidv4()}.raw` : this.selectNote.split('/').pop();

    this.selectNote = `${path}/${fileName}`;
    // FIXME: 文件保存逻辑
    await fs.mkdir(path, {
      recursive: true,
    });

    fs.writeFile(`${path}/${fileName}`, editorState.toRAW())
      .then(() => {
        message.success('笔记保存成功!');
        this.setState({ isAddNote: false, initEditorData: editorState });
      })
      .then(async () => {
        dispatch({
          type: 'edit/addNote',
          payload: {
            userId,
            title: editorState.toRAW(true).blocks[0].text.slice(0, 20),
            fileName,
          },
        });
      })
      .catch(err => {
        notification.error({
          message: '保存笔记失败!',
          description: err,
        });
      });
  };

  handleExportToPdf = () => {
    const { currentNote } = this.props;
    const options = {
      margin: 1,
      filename: `${currentNote
        .split('/')
        .pop()
        .replace('.raw', '')}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    fs.readFile(currentNote, { encoding: 'utf-8' }).then(res => {
      html2pdf()
        .set(options)
        .from(BraftEditor.createEditorState(res).toHTML())
        .save();
    });
  };

  handleAddNote = () => {
    this.setState({ isAddNote: true, initEditorData: BraftEditor.createEditorState('') });
  };

  handleDeleteNote = () => {
    const { dispatch, userId, currentNote } = this.props;
    dispatch({
      type: 'edit/delNotes',
      payload: {
        userId,
        path: currentNote,
      },
    });
  };

  handleOpenNote = () => {
    const { currentNote } = this.props;
    this.selectNote = currentNote;
    fs.readFile(currentNote, { encoding: 'utf-8' }).then(res => {
      this.setState({ isAddNote: false, initEditorData: BraftEditor.createEditorState(res) });
    });
  };

  render() {
    const { collapsed, initEditorData } = this.state;
    const { userId } = this.props;
    const avatar = `./resource/users/avatars/${userId}.jpg`;

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
          <NoteList
            collapsed={collapsed}
            onOpenNote={this.handleOpenNote}
            onExportToPdf={this.handleExportToPdf}
            onAddNote={this.handleAddNote}
            onDeleteNote={this.handleDeleteNote}
          />
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
        <Tooltip className={styles.floatButton} title="保存" placement="left" >
          <Button onClick={this.handleSaveByRAW} type="primary" shape="circle" icon="save" />
        </Tooltip>
        ,
        <Dropdown
          overlay={
            <AntdMenu>
              <AntdMenu.Item onClick={this.handleOutLogin}>退出登录</AntdMenu.Item>
            </AntdMenu>
          }
          placement="topCenter"
        >
          <Avatar
            className={styles.floatButtonUser}
            style={{ backgroundColor: '#f56a00', verticalAlign: 'middle' }}
            size="large"
            icon="user"
            src={avatar}
          ></Avatar>
        </Dropdown>
      </Layout>
    );
  }
}

export default FormDemo;

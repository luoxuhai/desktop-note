import React from 'react';
import BraftEditor from 'braft-editor';
import { ContentUtils } from 'braft-utils';
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
  Modal,
  Input,
} from 'antd';
import { connect } from 'dva';
import uuidv4 from 'uuid/v4';
import html2pdf from 'html2pdf.js';
import router from 'umi/router';
import styles from './index.less';
import NoteList from './components/NoteList';
import Template from './components/Template';
import FaceRecognition from '../../components/FaceRecognition';

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
let isKeyDown = false;
let isFocusEdit = false;

const extendControls = [
  {
    key: 'custom-button',
    type: 'button',
    text: '批改',
  },
];
@connect(({ edit, login }) => ({
  ...edit,
  ...login,
}))
class Home extends React.Component {
  state = {
    collapsed: false,
    initEditorData: BraftEditor.createEditorState(''),
    isAddNote: true,
    templateVisible: false,
  };

  selectNote = null;

  editorValue = '';

  recordValue = null;

  componentDidMount() {
    document.title = 'ImPro Recorder';
    notification.open({
      message: '欢迎来到 ImPro Recorder',
      description:
        '本软件采用了多重安全手段，以保障用户数据安全。安全级别高、灾备能力强、双重加密、多项安全认证，旨在提升科研记录的效率，规范、统一科研记录的格式，限制科研记录的记录时间和修改权限，保证每一次记录的真实可靠，并能实时共享，实现科研记录的智能化和网络化。',
      icon: <Icon type="smile" style={{ color: '#47c479' }} />,
    });
    setTimeout(() => {
      notification.open({
        onClose: null,
        description: (
          <div style={{ fontSize: 16 }}>
            实时人脸识别中
            <Icon style={{ marginLeft: 5, color: '#47c479' }} spin type="instagram" />
          </div>
        ),
        duration: null,
        placement: 'topRight',
        top: 150,
        style: {
          width: 190,
          height: 100,
          marginLeft: 335 - 85,
        },
      });
    }, 4500);
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
    window.onkeydown = () => {
      const { initEditorData } = this.state;
      if (!isKeyDown && isFocusEdit) {
        Modal.confirm({
          title: '输入内容',
          maskClosable: true,
          width: 600,
          icon: <Icon type="edit" />,
          okText: '插入',
          cancelText: '取消',
          content: (
            <Input.TextArea
              cols={5}
              rows={6}
              placeholder="例: 删除第一段"
              onChange={e => {
                this.editorValue = e.target.value;
              }}
            />
          ),
          onCancel: () => {
            isKeyDown = false;
          },
          onOk: () => {
            this.setState({
              initEditorData: ContentUtils.insertText(initEditorData, this.editorValue),
            });
            this.editorValue = '';
            isKeyDown = false;
            isFocusEdit = true;
          },
        });
        isKeyDown = true;
        return false;
      }
    };
  }

  componentDidUpdate() {
    const controlbarH = document.querySelector('.bf-controlbar').clientHeight;
    document.querySelector('.bf-content').style.height = `calc(100vh - ${controlbarH}px)`;
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'edit/clear',
    });
  }

  onCollapse = () => {
    const { collapsed } = this.state;
    this.setState({ collapsed: !collapsed });
  };

  handleChange = out => {
    editorState = out;
    this.setState({
      initEditorData: out,
    });
  };

  handleBlurEdit = () => {
    isFocusEdit = false;
  };

  handleFocusEdit = () => {
    isFocusEdit = true;
  };

  handleShowTemplateModal = () => {
    this.setState({
      templateVisible: true,
    });
  };

  handleHideTemplateModal = () => {
    this.setState({
      templateVisible: false,
    });
  };

  handleOutLogin = () => {
    window.localStorage.removeItem('userId');
    router.replace('/user/login');
  };

  handleSaveByRAW = async () => {
    const { userId, dispatch } = this.props;
    const { isAddNote } = this.state;
    // ! 区别新增文件与编辑文件
    const fileName = isAddNote ? uuidv4() : this.selectNote.split('/').pop();
    const path = `./resource/notes/${userId}/${fileName}`;

    const saveNote = async () => {
      this.selectNote = path;
      // FIXME: 文件保存逻辑
      await fs.mkdir(path, {
        recursive: true,
      });

      fs.writeFile(`${path}/${Date.now()}.${this.recordValue || '更新'}.raw`, editorState.toRAW())
        .then(() => {
          message.success('笔记保存成功!');
          this.recordValue = null;
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

    if (isAddNote) {
      this.recordValue = '初始化';
      saveNote();
    } else {
      Modal.warning({
        title: '提交操作记录',
        maskClosable: true,
        content: (
          <Input.TextArea
            placeholder="例: 删除第一段"
            onChange={e => {
              this.recordValue = e.target.value.replace(/[\r\n]/g, '').replace(':', '：');
            }}
          />
        ),
        onOk: saveNote,
      });
    }
  };

  handleExportToPdf = () => {
    const { currentNote } = this.props;
    const options = {
      margin: 1,
      filename: `${currentNote.split('/').pop()}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };
    const hideLoading = message.loading('导出中...', 0);

    fs.readdir(currentNote).then(record => {
      fs.readFile(`${currentNote}/${record.pop()}`, { encoding: 'utf-8' }).then(res => {
        html2pdf()
          .set(options)
          .from(BraftEditor.createEditorState(res).toHTML())
          .save()
          .then(() => {
            hideLoading();
          });
      });
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

  handleOpenNote = async (path, isRecord = false) => {
    const { currentNote } = this.props;

    this.selectNote = currentNote;
    if (isRecord) {
      fs.readFile(path, { encoding: 'utf-8' }).then(res => {
        this.setState({ isAddNote: false, initEditorData: BraftEditor.createEditorState(res) });
      });
    } else {
      fs.readdir(path || currentNote).then(record => {
        fs.readFile(`${currentNote}/${record.pop()}`, { encoding: 'utf-8' }).then(res => {
          this.setState({ isAddNote: false, initEditorData: BraftEditor.createEditorState(res) });
        });
      });
    }
  };

  handleOpenTemplate = path => {
    fs.readFile(path, { encoding: 'utf-8' }).then(res => {
      this.setState({ initEditorData: BraftEditor.createEditorState(res) });
    });
  };

  render() {
    const { collapsed, initEditorData, templateVisible, isAddNote } = this.state;
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
                  onBlur={this.handleBlurEdit}
                  onFocus={this.handleFocusEdit}
                  extendControls={extendControls}
                  placeholder="输入内容"
                />
              </Col>
            </Row>
          </Layout.Content>
        </Layout>
        <Tooltip className={styles.floatButtonTemplate} title="模板" placement="left">
          <Button
            onClick={this.handleShowTemplateModal}
            style={{ backgroundColor: '#ffbf00', color: 'white' }}
            shape="circle"
            icon="pie-chart"
          />
        </Tooltip>
        <Tooltip className={styles.floatButton} title="保存" placement="left">
          <Button onClick={this.handleSaveByRAW} type="primary" shape="circle" icon="save" />
        </Tooltip>
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
        <Modal
          title="模板"
          width={900}
          visible={templateVisible}
          onOk={this.handleHideTemplateModal}
          onCancel={this.handleHideTemplateModal}
        >
          <Template
            isAddNote={isAddNote}
            onOpenTemplate={this.handleOpenTemplate}
            onCancel={this.handleHideTemplateModal}
          />
        </Modal>
        <FaceRecognition isHome />
      </Layout>
    );
  }
}

export default Home;

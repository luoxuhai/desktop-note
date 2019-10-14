import { Alert, Checkbox, Icon, Modal, Button } from 'antd';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import React, { Component } from 'react';
import Link from 'umi/link';
import { connect } from 'dva';
import LoginComponents from './components/Login';
import FaceRecognition from './components/FaceRecognition';
import styles from './style.less';

const { Tab, UserName, Password, Mobile, Captcha, Submit } = LoginComponents;

@connect(({ login, loading }) => ({
  ...login,
}))
class Login extends Component {
  loginForm = undefined;

  state = {
    type: 'account',
    autoLogin: true,
  };

  changeAutoLogin = e => {
    this.setState({
      autoLogin: e.target.checked,
    });
  };

  handleSubmit = (err, values) => {
    const { type } = this.state;

    if (!err) {
      const { dispatch } = this.props;
      dispatch({
        type: 'login/login',
        payload: { ...values, type },
      });
    }
  };

  onTabChange = type => {
    this.setState({
      type,
    });
  };

  onGetCaptcha = () =>
    new Promise((resolve, reject) => {
      if (!this.loginForm) {
        return;
      }

      this.loginForm.validateFields(['mobile'], {}, async (err, values) => {
        if (err) {
          reject(err);
        } else {
          const { dispatch } = this.props;

          try {
            const success = await dispatch({
              type: 'login/getCaptcha',
              payload: values.mobile,
            });
            resolve(!!success);
          } catch (error) {
            reject(error);
          }
        }
      });
    });

  renderMessage = content => (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );

  handleShowFaceRecoClick = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'login/changeModalVisible',
      payload: true,
    });
    dispatch({
      type: 'login/changeTranscribe',
      payload: false,
    });
  };

  handleHideFaceRecoClick = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'login/changeModalVisible',
      payload: false,
    });
  };

  render() {
    const { status, submitting, isModalVisible, isTranscribe } = this.props;
    const { type, autoLogin } = this.state;
    return (
      <div className={styles.main}>
        <LoginComponents
          defaultActiveKey={type}
          onTabChange={this.onTabChange}
          onSubmit={this.handleSubmit}
          onCreate={form => {
            this.loginForm = form;
          }}
        >
          <Tab
            key="account"
            tab={formatMessage({
              id: 'user-login.login.tab-login-credentials',
            })}
          >
            {status === 'error' &&
              this.renderMessage(
                formatMessage({
                  id: 'user-login.login.message-invalid-credentials',
                }),
              )}
            <UserName
              name="userName"
              placeholder={`${formatMessage({
                id: 'user-login.login.userName',
              })}`}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: 'user-login.userName.required',
                  }),
                },
              ]}
            />
            <Password
              name="password"
              placeholder={`${formatMessage({
                id: 'user-login.login.password',
              })}`}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: 'user-login.password.required',
                  }),
                },
              ]}
              onPressEnter={e => {
                e.preventDefault();

                if (this.loginForm) {
                  this.loginForm.validateFields(this.handleSubmit);
                }
              }}
            />
          </Tab>
          <Tab
            key="mobile"
            tab={formatMessage({
              id: 'user-login.login.tab-login-mobile',
            })}
          >
            {status === 'error' &&
              !submitting &&
              this.renderMessage(
                formatMessage({
                  id: 'user-login.login.message-invalid-verification-code',
                }),
              )}
            <Mobile
              name="mobile"
              placeholder={formatMessage({
                id: 'user-login.phone-number.placeholder',
              })}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: 'user-login.phone-number.required',
                  }),
                },
                {
                  pattern: /^1\d{10}$/,
                  message: formatMessage({
                    id: 'user-login.phone-number.wrong-format',
                  }),
                },
              ]}
            />
            <Captcha
              name="captcha"
              placeholder={formatMessage({
                id: 'user-login.verification-code.placeholder',
              })}
              countDown={120}
              onGetCaptcha={this.onGetCaptcha}
              getCaptchaButtonText={formatMessage({
                id: 'user-login.form.get-captcha',
              })}
              getCaptchaSecondText={formatMessage({
                id: 'user-login.captcha.second',
              })}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: 'user-login.verification-code.required',
                  }),
                },
              ]}
            />
          </Tab>
          <div>
            <Checkbox checked={autoLogin} onChange={this.changeAutoLogin}>
              <FormattedMessage id="user-login.login.remember-me" />
            </Checkbox>
            <Icon
              className={styles.face}
              style={{
                float: 'right',
                fontSize: 24,
              }}
              onClick={this.handleShowFaceRecoClick}
              type="smile"
            />
          </div>
          <Submit loading={submitting}>
            <FormattedMessage id="user-login.login.login" />
          </Submit>
          <div className={styles.other}>
            <FormattedMessage id="user-login.login.sign-in-with" />
            <Icon type="alipay-circle" className={styles.icon} theme="outlined" />
            <Icon type="taobao-circle" className={styles.icon} theme="outlined" />
            <Icon type="weibo-circle" className={styles.icon} theme="outlined" />
            <Link className={styles.register} to="/user/login">
              <FormattedMessage id="user-login.login.signup" />
            </Link>
          </div>
        </LoginComponents>
        <Modal
          title={isTranscribe ? '人脸数据录入' : '人脸识别登录'}
          visible={isModalVisible}
          maskClosable={false}
          closable={false}
          footer={[
            <Button key="back" type="primary" onClick={this.handleHideFaceRecoClick}>
              账号密码登录
            </Button>,
          ]}
          destroyOnClose
        >
          <FaceRecognition />
        </Modal>
      </div>
    );
  }
}

export default Login;

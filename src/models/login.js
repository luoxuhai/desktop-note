import { routerRedux } from 'dva/router';
import { stringify } from 'querystring';
import Dexie from 'dexie';
import uuidv4 from 'uuid/v4';
import { message, notification } from 'antd';
import { formatMessage } from 'umi-plugin-react/locale';
import { fakeAccountLogin, getFakeCaptcha } from '@/services/login';
import { setAuthority } from '@/utils/authority';
import { getPageQuery } from '@/utils/utils';

const db = new Dexie('note');
db.version(1).stores({
  users: 'userId, userName, password, avatar, note',
});

const Model = {
  namespace: 'login',
  state: {
    status: undefined,
    userId: window.localStorage.getItem('userId') || '',
    isModalVisible: false,
    isTranscribe: false,
  },
  effects: {
    *login(
      {
        payload: { userName, password },
      },
      { call, put },
    ) {
      const response = yield db.users.get({
        userName,
      });

      if (!response) {
        const userId = uuidv4();
        yield db.users.add({ userId, userName, password });
        notification.warning({
          message: '温馨提示',
          description: '第一次登录需录入人脸数据',
          key: 'transcribe',
        });

        yield put({
          type: 'saveUserId',
          payload: userId,
        });

        yield put({
          type: 'changeTranscribe',
          payload: true,
        });
        yield put({
          type: 'changeModalVisible',
          payload: true,
        });
      } else if (response.password === password) {
        yield put({
          type: 'saveUserId',
          payload: response.userId,
        });
        const urlParams = new URL(window.location.href);
        const params = getPageQuery();
        let { redirect } = params;

        if (redirect) {
          const redirectUrlParams = new URL(redirect);

          if (redirectUrlParams.origin === urlParams.origin) {
            redirect = redirect.substr(urlParams.origin.length);

            if (redirect.match(/^\/.*#/)) {
              redirect = redirect.substr(redirect.indexOf('#') + 1);
            }
          } else {
            window.location.href = redirect;
            return;
          }
        }

        yield put(routerRedux.replace(redirect || '/'));
      } else {
        yield put({
          type: 'changeLoginStatus',
          payload: 'error',
        });
        message.error(
          formatMessage({
            id: 'user-login.login.message-invalid-credentials',
          }),
        );
      }
    },

    *getCaptcha({ payload }, { call }) {
      yield call(getFakeCaptcha, payload);
    },

    *logout(_, { put }) {
      const { redirect } = getPageQuery(); // redirect

      if (window.location.pathname !== '/user/login' && !redirect) {
        yield put(
          routerRedux.replace({
            pathname: '/user/login',
            search: stringify({
              redirect: window.location.href,
            }),
          }),
        );
      }
    },
  },
  reducers: {
    changeLoginStatus(state, { payload }) {
      return { ...state, status: payload.status };
    },

    changeModalVisible(state, { payload }) {
      return { ...state, isModalVisible: payload };
    },

    changeTranscribe(state, { payload }) {
      return { ...state, isTranscribe: payload };
    },

    saveUserId(state, { payload }) {
      window.localStorage.setItem('userId', payload);
      return { ...state, userId: payload };
    },
  },
};
export default Model;

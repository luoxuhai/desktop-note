import Dexie from 'dexie';
import { message } from 'antd';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { promises as fs } from 'fs';
import { queryCurrent, query as queryUsers } from '@/services/user';

moment.locale('zh-cn');
const db = new Dexie('note');
db.version(1).stores({
  users: 'userId, userName, password, avatar, notes',
});

const EditModel = {
  namespace: 'edit',
  state: {
    currentNote: '',
    notes: [],
  },
  effects: {
    *addNote(
      {
        payload: { userId, title, fileName },
      },
      { put },
    ) {
      const user = yield db.users.get({
        userId,
      });

      if (user) {
        const addData = {
          title,
          updatedAt: Date.now(),
          fileName,
        };

        const notes =
         typeof user.notes === 'object'
            ? [addData, ...user.notes.filter(e => e.fileName !== fileName)]
            : [addData];

        yield db.users.put({
          ...user,
          notes,
        });

        yield put({
          type: 'changeNotes',
          payload: {
            notes,
            userId: user.userId,
          },
        });
      } else {
        message.error('用户没有登录,请登录后重试');
      }
    },

    *delNotes(
      {
        payload: { userId, path },
      },
      { put },
    ) {
      const user = yield db.users.get({
        userId,
      });

      const notes = user.notes.filter(e => e.fileName !== path.split('/').pop());

      yield db.users.put({
        ...user,
        notes,
      });

      yield fs.unlink(path);

      yield put({
        type: 'changeNotes',
        payload: {
          notes,
          userId,
        },
      });

      message.success('删除完成');
    },

    *fetch(_, { call, put }) {
      const response = yield call(queryUsers);
      yield put({
        type: 'save',
        payload: response,
      });
    },

    *fetchCurrent(_, { call, put }) {
      const response = yield call(queryCurrent);
      yield put({
        type: 'saveCurrentUser',
        payload: response,
      });
    },
  },
  reducers: {
    saveCurrentUser(state, action) {
      return { ...state, currentUser: action.payload || {} };
    },

    changeCurrentNote(state, { payload }) {
      return { ...state, currentNote: payload };
    },

    changeNotes(state, { payload }) {
      const newNotes = payload.notes.map(({ title, updatedAt, fileName }) => ({
        title,
        updatedAt: moment(updatedAt).format('MM月DD日-HH:mm:ss'),
        path: `./resource/notes/${payload.userId}/${fileName}`,
      }));
      return { ...state, notes: newNotes };
    },
  },
};
export default EditModel;

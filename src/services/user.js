import request from '@/utils/request';

export async function query() {
  return request('/api/users');
}
export async function queryCurrent() {
  return request('/api/currentUser');
}
export async function queryNotices() {
  return request('/api/notices');
}
export async function faceMatch(data) {
  return request('https://aip.baidubce.com/rest/2.0/face/v3/match', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    params: {
      access_token: '24.8152b923fde62f2fcde59be541e1b7b9.2592000.1573564872.282335-17515319',
    },
    data,
  });
}
export async function accessToken(params) {
  return request('https://aip.baidubce.com/oauth/2.0/token', {
    params,
  });
}

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-buffer-constructor */
import React, { Component, useEffect, useState } from 'react';
import { message, Spin, notification } from 'antd';
import { connect } from 'dva';
import router from 'umi/router';
import fs from 'fs';
// import { faceClient } from '../../../../../utils/utils';
import { faceMatch, accessToken } from '../../services/user';
import styles from './index.less';

const stopStream = () => {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
};
const avatarDir = './resource/users/avatars';
fs.mkdirSync(avatarDir, {
  recursive: true,
});
const avatars = fs.readdirSync(avatarDir);

let intervalId = null;

export default connect(({ login }) => ({
  ...login,
}))(({ isTranscribe, userId, dispatch, isHome = false }) => {
  const [spinning, setSpinning] = useState(true);
  let errCount = 0;

  useEffect(() => {
    const init = async () => {
      const video = document.querySelector('#video-face');
      const canvas = document.querySelector('#canvas-face');
      const ctx = canvas.getContext('2d');
      let videoDevice = null;
      try {
        [videoDevice] = (await navigator.mediaDevices.enumerateDevices()).filter(
          e => e.kind === 'videoinput',
        );
      } catch (err) {
        message.error(err);
      }
      // 清除旧数据
      stopStream();

      const constraints = {
        video: {
          deviceId: {
            exact: videoDevice.deviceId,
          },
        },
      };
      // ! 获取图片并对比
      const getImage = async (w, h) => {
        // accessToken({
        //   grant_type: 'client_credentials',
        //   client_id: 'vBqGDcO9P4q7uQYDYhNBW6MM',
        //   client_secret: '85Ze9UpcbF9hYC6evr8fWo6vg8xqa9GR',
        // });
        ctx.drawImage(video, 0, 0, w, h);
        const imgData = canvas.toDataURL('image/jpeg', 0.99).replace('data:image/jpeg;base64,', '');

        if (isTranscribe) {
          fs.writeFile(`${avatarDir}/${userId}.jpg`, new Buffer(imgData, 'base64'), err => {
            if (err) message.error(err);
          });
          notification.close('transcribe');
          message.success('录入人脸数据成功!', 0.5);
          dispatch({
            type: 'login/changeModalVisible',
            payload: false,
          });
          dispatch({
            type: 'login/changeTranscribe',
            payload: false,
          });
          clearInterval(intervalId);
          stopStream();
          setTimeout(() => router.replace('/'), 500);
        } else {
          await Promise.all(
            avatars.map(async e => {
              const res = await faceMatch([
                {
                  image: imgData,
                  image_type: 'BASE64',
                  face_type: 'LIVE',
                },
                {
                  image: new Buffer(fs.readFileSync(`${avatarDir}/${e}`))
                    .toString('base64')
                    .replace('data:image/jpg;base64,', ''),
                  image_type: 'BASE64',
                  face_type: 'LIVE',
                },
              ]);

              if (res.error_code === 0 && res.result.score > 70 && !isHome) {
                message.success('人脸识别成功!', 0.5);
                dispatch({
                  type: 'login/saveUserId',
                  payload: e.replace('.jpg', ''),
                });
                dispatch({
                  type: 'login/changeModalVisible',
                  payload: false,
                });
                stopStream();
                clearInterval(intervalId);
                setTimeout(() => router.replace('/'), 500);
              }

              if (isHome && res.error_code === 222202) {
                errCount += 1;
                if (errCount < 3) return;
                stopStream();
                clearInterval(intervalId);
                message.success('非当前登录用户!', 1000);
                setTimeout(() => router.replace('/user/login'), 1000);
              }
            }),
          );
        }
      };

      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        setSpinning(false);
        window.stream = stream;
        video.srcObject = stream;
        const w = video.width;
        const h = video.height;
        canvas.width = w;
        canvas.height = h;
        intervalId = setInterval(getImage.bind(null, w, h), isHome ? 3000 : 800);
      });
    };

    init();

    // 需要在 componentWillUnmount 执行的内容
    return function cleanup() {
      stopStream();
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className={styles.container} style={{ display: isHome ? 'none' : '' }}>
      <Spin tip="加载中..." spinning={spinning} size="large">
        <canvas id="canvas-face" style={{ display: 'none' }} />
        <video
          id="video-face"
          muted
          autoPlay
          width="800"
          height="600"
          style={{ width: 300, height: 300, borderRadius: '50%', backgroundColor: '#000' }}
        />
      </Spin>
    </div>
  );
});

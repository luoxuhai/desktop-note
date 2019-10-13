/* eslint-disable no-buffer-constructor */
import React, { Component, useEffect, useState } from 'react';
import { Form, message, Spin } from 'antd';
import fs from 'fs';
// import { faceClient } from '../../../../../utils/utils';
import { faceMatch, accessToken } from '../../../../../services/user';
import styles from './index.less';

const stopStream = () => {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
};

let intervalId = null;

const FaceRecognition = () => {
  const [spinning, setSpinning] = useState(true);
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

      const getImage = (w, h) => {
        // accessToken({
        //   grant_type: 'client_credentials',
        //   client_id: 'vBqGDcO9P4q7uQYDYhNBW6MM',
        //   client_secret: '85Ze9UpcbF9hYC6evr8fWo6vg8xqa9GR',
        // });
        ctx.drawImage(video, 0, 0, w, h);
        faceMatch([
          {
            image: canvas.toDataURL('image/jpeg', 0.99).replace('data:image/jpeg;base64,', ''),
            image_type: 'BASE64',
            face_type: 'LIVE',
          },
          {
            image: new Buffer(fs.readFileSync('./resource/users/avatar/test.jpg'))
              .toString('base64')
              .replace('data:image/jpg;base64,', ''),
            image_type: 'BASE64',
            face_type: 'LIVE',
          },
        ]).then(res => {
          if (res.error_msg === 'SUCCESS') {
            if (res.result.score > 70) {
              stopStream();
            }
          }
        });
      };

      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        setSpinning(false);
        window.stream = stream;
        video.srcObject = stream;
        const w = video.width;
        const h = video.height;
        canvas.width = w;
        canvas.height = h;
        intervalId = setInterval(getImage.bind(null, w, h), 800);
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
    <div className={styles.container}>
      <Spin tip="加载中..." spinning={spinning} size="large">
        <canvas id="canvas-face" style={{ display: 'none' }} />
        <video
          id="video-face"
          muted
          autoPlay
          width="600"
          height="600"
          style={{ width: 300, height: 300, borderRadius: '50%', backgroundColor: '#000' }}
        />
      </Spin>
    </div>
  );
};
export default FaceRecognition;

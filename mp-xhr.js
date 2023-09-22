'use strict';

import utils from './../utils.js';
import settle from './../core/settle.js';
import buildURL from './../helpers/buildURL.js';
import buildFullPath from '../core/buildFullPath.js';
import AxiosError from '../core/AxiosError.js';
import CanceledError from '../cancel/CanceledError.js';
import parseProtocol from '../helpers/parseProtocol.js';
import platform from '../platform/index.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
// import speedometer from '../helpers/speedometer.js';

// function progressEventReducer(listener, isDownloadStream) {
//   let bytesNotified = 0;
//   const _speedometer = speedometer(50, 250);

//   return e => {
//     const loaded = e.loaded;
//     const total = e.lengthComputable ? e.total : undefined;
//     const progressBytes = loaded - bytesNotified;
//     const rate = _speedometer(progressBytes);
//     const inRange = loaded <= total;

//     bytesNotified = loaded;

//     const data = {
//       loaded,
//       total,
//       progress: total ? (loaded / total) : undefined,
//       bytes: progressBytes,
//       rate: rate ? rate : undefined,
//       estimated: rate && total && inRange ? (total - loaded) / rate : undefined,
//       event: e
//     };

//     data[isDownloadStream ? 'download' : 'upload'] = true;

//     listener(data);
//   };
// }


export default function (config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    let requestData = config.data;
    const requestHeaders = AxiosHeaders.from(config.headers).normalize();
    const responseType = config.responseType;
    let onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }

    if (utils.isFormData(requestData)) {
      requestHeaders.setContentType('multipart/form-data;', false); // mobile/desktop app frameworks
    }

    // HTTP basic authentication
    if (config.auth) {
      const username = config.auth.username || '';
      const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.set('Authorization', 'Basic ' + btoa(username + ':' + password));
    }

    const fullPath = buildFullPath(config.baseURL, config.url);

    let request = null;

    function onloadend(data, status, responseHeaders) {
      if (!request) {
        return;
      }
      // Prepare the response
      const response = {
        data,
        status,
        statusText: undefined,
        headers: responseHeaders,
        config,
        request
      };

      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }

    // // Add withCredentials to request if needed
    // if (!utils.isUndefined(config.withCredentials)) {
    //   request.withCredentials = !!config.withCredentials;
    // }

    // // Handle progress if needed
    // if (typeof config.onDownloadProgress === 'function') {
    //   request.addEventListener('progress', progressEventReducer(config.onDownloadProgress, true));
    // }

    // // Not all browsers support upload events
    // if (typeof config.onUploadProgress === 'function' && request.upload) {
    //   request.upload.addEventListener('progress', progressEventReducer(config.onUploadProgress));
    // }

    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = cancel => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
        request.abort();
        request = null;
      };

      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }

    const protocol = parseProtocol(fullPath);

    if (protocol && platform.protocols.indexOf(protocol) === -1) {
      reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
      return;
    }

    const encoding = config.responseEncoding ?? 'utf8';

    request = wx.request({
      url: buildURL(fullPath, config.params, config.paramsSerializer),
      enableHttp2: true,
      dataType: config.responseType,
      responseType: encoding === 'utf8' ? 'text' : 'arraybuffer',
      method: config.method,
      data: config.data,
      headers: requestHeaders.toJSON(),
      timeout: config.timeout,
      ...config.wx,
      success({data, statusCode: status, header: headers}) {
        onloadend(data, status, headers);
      },
      fail({errno, errMsg: errorMessage}) {
        reject(AxiosError.from(new Error(errorMessage), errno, config));
      },
    });
  });
}

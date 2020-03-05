chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.greeting) {
      let res = awaitRequest(request.greeting).then(sendResponse);
      return true;
    }

    return false;
  },
);

async function awaitRequest(json) {
  const answer = await attemptSendRequest(json);
  return answer;
}

async function attemptSendRequest(obj, repeat = 3) {
  return sendRequest(obj)
    .then(data => data)
    .catch((jqXHR) => {
      if (jqXHR.status >= 200 && jqXHR.status < 300) {
        return { statusPg: jqXHR.status, res: jqXHR.responseText };
      }

      const repeatNew = repeat - 1;
      console.log(`err: repeat ${repeat}`, obj);

      if (repeat > 1 && jqXHR.status !== 404) {
        return attemptSendRequest(obj, repeatNew);
      }

      return { statusPg: jqXHR.status, jqXHR, repeat };
    });
}

async function sendRequest(obj) {
  return new Promise((resolve, reject) => {
    console.log('data', obj);
    if (!window.jQuery) {
      console.log('data2 not');
    } else {
      console.log('data2 yes');
    }
    $.ajax(obj).done((json) => {
      resolve(json);
    }).fail((jqXHR) => {
      reject(jqXHR);
    });
  });
}

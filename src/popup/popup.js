import * as $ from 'jquery';
import CreatorPupopController from './CreatorPupopController.js';
import './popup.scss';

let bcTypePanel;

$(document).ready(() => {
  createMain();
});

$('body').on('click', 'button', function () {
  if ($(this).attr('nameFun') === 'notifications') {
    const optionsUrl = chrome.extension.getURL('notifications.html');
    chrome.tabs.query({ url: optionsUrl }, tabs => {
      if (tabs.length) {
        chrome.tabs.update(tabs[0].id, { active: true });
      } else {
        chrome.tabs.create({ url: optionsUrl });
      }
    });
  }
});

function createMain() {
  const controller = new CreatorPupopController();

  chrome.storage.sync.get(['bcTypePanel'], items => {
    controller.setStorageItems(items);

    $.each(dataMain, (i, item) => {
      controller.controller(item);
    });
  });

  $('.out').append(controller.divItems);
}

const dataMain = [{
  type: 'button',
  id: 'bc-notifications',
  nameFun: 'notifications',
  h1: 'New notifications',
}];

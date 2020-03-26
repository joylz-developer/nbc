// import './reset.css';
import './notifications.scss';

import * as $ from 'jquery';

import GroupsController from './GroupsController.js';
import ControlerBlocksList from './ControlerBlocksList.js';
import ControlerShortcuts from './ControlerShortcuts.js';
import sleep from './sleep.js';
import setMini from './setMini.js';
import { async } from '../../dist/vendors~notifications.2b843a117f1424723bf3';


let menu;
let selected;

let ContrMenu;
let ContrSelected;
let ContrGroups;
let ControShortcuts;

const optionsNotif = {
  'bool-input': {
    'unread-translucent': false,
    'leave-unread': false,
  },
  'bool-event': {
    'hide-read': false,
    'hide-followers': false,
    'hide-likes': false,
    'hide-comments': false,
    'hide-deleted': false,
    'hide-tagged': false,
  },
  'value-input': {
    'only-actor': '',
    'start-page': 1,
  },
};

let cacheMiniatures = {
  val: new Map(),
  get v() {
    return this.val;
  },
  set(i, v) {
    this.val.set(i, v);
    $('.size-cache-mini > p').text(this.val.size);
  },
  clear() {
    this.val.clear();
    $('.size-cache-mini > p').text(0);
  },
};

let isLoading = {
  val: false,
  get v() {
    return this.val;
  },
  set v(b) {
    this.val = b;
    $('.div-anim-processing').attr('activate', b);
  },
};

const target = document.body;
const observer = new MutationObserver(((mutations) => {
  vulcanizeInlines();
}));

const config = {
  childList: true,
  characterData: true,
  subtree: true,
};

document.addEventListener('DOMContentLoaded', () => {
  vulcanizeInlines();
  observer.observe(target, config);
});

const events = ['onclick', 'onmouseover', 'onmouseout', 'onmousedown',
  'onmouseup', 'onscroll', 'oncontextmenu', 'onmousewheel', 'ondblclick', 'onload'];

function vulcanizeInlines() {
  for (let i = 0; i < events.length; i++) {
    const els = getAllElementsWithAttribute(events[i]);
    for (let j = 0; j < els.length; j++) {
      const fun = eval(`(function a(){${els[j].getAttribute(events[i])}})`);
      els[j].removeAttribute(events[i]);
      els[j][events[i]] = fun;
    }
  }
}

function getAllElementsWithAttribute(attribute) {
  const matchingElements = [];
  const allElements = document.getElementsByTagName('*');
  for (let i = 0, n = allElements.length; i < n; i++) {
    if (allElements[i].getAttribute(attribute) !== null) {
      // Element exists with attribute. Add to array.
      matchingElements.push(allElements[i]);
    }
  }
  return matchingElements;
}

function onloadImg(item) {
  if ($(item).parent().attr('class') === 'con-blur') {
    $(item).addClass('visible-blur');
  } else {
    $(item).addClass('visible');
  }
}

$(document).ready(async () => {
  const urlToIcon = chrome.extension.getURL('uploads/svg-pack-notif.html');
  $.get(urlToIcon).done((data) => {
    $('body').append(data);
  });

  // chrome.storage.sync.get(['cacheMiniatures'], (obj) => {
  //   console.log(obj);

  //   if (obj.cacheMiniatures) {
  //     cacheMiniatures = obj.cacheMiniatures;
  //   }
  // });

  menu = $('.panel-with-menu');
  selected = $('.panel-with-selected');

  ContrGroups = new GroupsController(optionsNotif, cacheMiniatures, selected);

  const configMenu = [
    [],
    54,
    20,
    menu,
    menu.find('.list'),
    GroupsController.fill,
    scrollEnd,
    null,
    scrollPanelNext,
    null,
    GroupsController.update,
  ];

  ContrMenu = new ControlerBlocksList(...configMenu);
  ContrMenu.generateBl();

  const configSelected = [
    [],
    54,
    20,
    selected,
    selected.find('.list'),
    GroupsController.fill,
    null,
    null,
    scrollPanelNext,
    null,
    GroupsController.update,
  ];

  ContrSelected = new ControlerBlocksList(...configSelected);
  ContrSelected.generateBl();

  isLoading.v = false;

  if (await ContrGroups.getPageNotifs(isLoading)) {
    ContrMenu.splice(ContrMenu.getData().length - 1, 1, ContrGroups.curDataVal);
    isLoading.v = false;

    setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);
  }

  ControShortcuts = new ControlerShortcuts(shortcuts);
});

$('body').on('click', '.con-notif[group-id]', function () {
  const id = parseInt($(this).attr('group-id'), 10);
  const itemId = parseInt($(this).parent().attr('item'), 10);
  const data = ContrMenu.getData()[itemId];

  setTitleSelected(data);

  ContrSelected.set(ContrGroups.getCurGroupsData()[id], true);
  ContrGroups.setCurSelectedGroupId({ id, itemId });
  setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);
});

$('body').on('input', '[filter]', function () {
  const name = $(this).attr('filter');
  const checked = $(this).prop('checked');

  optionsNotif['bool-event'][`hide-${name}`] = !checked;

  setApplyFilter();
});

$('body').on('input', '#find-user', function () {
  const val = $(this).val();
  optionsNotif['value-input']['only-actor'] = val;

  setApplyFilter();
});

$('body').on('click', '.find-user-clear', () => {
  $('#find-user').val('').trigger('input');
});

$('body').on('focus', '#find-user', (el) => {
  $(el.target).select();
});

$('body').on('click', '.content-title[data-user]', function (event) {
  if ($(event.target).is('.content-title')) {
    event.preventDefault();
    event.stopPropagation();

    const name = $(this).attr('data-user');

    if (typeof name === 'string') {
      if (name === $('#find-user').val()) {
        $('#find-user').val('').trigger('input');
      } else {
        $('#find-user').val(name).trigger('input');
      }
    }
  }
});

$('body').on('click', '.con-notif', async function (event) {
  if ($(this).closest('.con-notif').is('.single, .single-photo')) {
    await readNotif($(this));
  }
});

$('body').on('click', '.reading-bubble', async function (event) {
  if ($(event.target).is('.reading-bubble')) {
    event.preventDefault();
    event.stopPropagation();

    const con = $(this).closest('.con-notif');

    if (con.is('.single, .single-photo')) {
      console.log('single');
      await readNotif(con);
    } else if (con.is('.group')) {
      console.log('group');
      await readGroup(con);
    }
  }
});

$('body').on('click', '.size-cache-mini', () => {
  cacheMiniatures.clear();
});

$('body').on('click', '.cur-page', async () => {
  const date = ContrGroups.todayVal;
  ContrMenu.set([], true);
  ContrSelected.set([], true);

  ContrGroups = new GroupsController(optionsNotif, cacheMiniatures, selected, date);
  setTitleSelected('clear');

  if (await ContrGroups.getPageNotifs(isLoading)) {
    ContrMenu.splice(ContrMenu.getData().length - 1, 1, ContrGroups.curDataVal);
    isLoading.v = false;

    setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);
  }
});

$('body').on('click', '.cur-time', async () => {
  ContrMenu.set([], true);
  ContrSelected.set([], true);

  ContrGroups = new GroupsController(optionsNotif, cacheMiniatures, selected);
  setTitleSelected('clear');

  if (await ContrGroups.getPageNotifs(isLoading)) {
    ContrMenu.splice(ContrMenu.getData().length - 1, 1, ContrGroups.curDataVal);
    isLoading.v = false;

    setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);
  }
});

$('body').on('change', 'input[name="themes"]', function () {
  $('html').attr('theme', $(this).attr('value'));
});


$('body').on({
  mouseenter() {
    saveLastHover = this;
  },
  mouseleave() {
    saveLastHover = '';
  },
}, '.con-notif.single, .con-notif.single-photo');


let saveLastHover = '';

function shortcuts(data) {
  if (data[0] === 16 && data[1] === 81) {
    if (saveLastHover !== '') {
      const user = $(saveLastHover).find('.content-title').attr('data-user');

      setNewActorLikingUser(user);
    }
  }
}

function setNewActorLikingUser(act) {
  const actor = act;

  console.log(actor);
  // chrome.runtime.sendMessage({
  //   likingUser: actor,
  // });
}

async function readNotif(con) {
  const rootContr = con.closest('.panel-with-menu, .panel-with-selected').attr('class');
  const indData = parseInt(con.attr('index-data'), 10);
  const itemId = parseInt(con.closest('.item-menu').attr('item'), 10);

  console.log(con, rootContr, indData, itemId);

  if (rootContr === 'panel-with-menu') {
    const data = ContrMenu.getData();
    const { id } = data[itemId];

    // const rez = await GroupsController.markItRead(id);
    const rez = { success: true };
    await sleep(1000);

    if (rez.success !== true) {
      console.log('rez', rez);
      return false;
    }

    data[itemId].unread = false;
    ContrMenu.update(itemId, data[itemId]);

    if (ContrGroups.optionsVal['bool-event']['hide-read']) {
      ContrMenu.splice(itemId, 1);
    }
  } else {
    const dataSelected = ContrSelected.getData();
    const { id } = dataSelected[itemId];

    // const rez = await GroupsController.markItRead(id);
    const rez = { success: true };
    await sleep(1000);

    if (rez.success !== true) {
      console.log('rez', rez);
      return false;
    }

    dataSelected[itemId].unread = false;

    const curSelected = ContrGroups.getCurSelectedGroupId();
    const idSelected = curSelected.id;

    const dataGroups = ContrGroups.getCurGroupsData();
    dataGroups[idSelected][itemId].unread = false;
    ContrGroups.setCurGroupsData(dataGroups);

    let dataMenu = ContrMenu.getData();
    dataMenu[curSelected.itemId].countUnread -= 1;

    if (ContrGroups.optionsVal['bool-event']['hide-read']) {
      dataMenu[curSelected.itemId].count -= 1;
    }

    if (dataMenu[curSelected.itemId].count === 0) {
      ContrMenu.splice(curSelected.itemId, 1);
    } else {
      ContrMenu.update(curSelected.itemId, dataMenu[curSelected.itemId]);
    }

    ContrSelected.update(itemId, dataSelected[itemId]);

    if (ContrGroups.optionsVal['bool-event']['hide-read']) {
      ContrSelected.splice(itemId, 1);
    }
  }

  ContrGroups.updateData(indData, 'unread', false);

  return true;
}

async function readGroup(con) {
  const idxDataGroup = parseInt(con.attr('group-id'), 10);
  const itemId = parseInt(con.closest('.item-menu').attr('item'), 10);

  const dataGroup = ContrGroups.getCurGroupsData()[idxDataGroup].map((el) => {
    return { idxData: el.idxData, id: el.id };
  });

  if (dataGroup !== null) {
    for await (const el of dataGroup) {
      // const rez = await GroupsController.markItRead(el.idxData);
      const rez = { success: true };
      await sleep(1000);

      if (rez.success !== true) {
        console.error('rez read notification', rez, el);
        continue;
      }

      const dataMenu = ContrMenu.getData();
      const dataSelected = ContrSelected.getData();

      ContrGroups.updateData(el.idxData, 'unread', false);

      const isHideRead = ContrGroups.optionsVal['bool-event']['hide-read'];

      // update Selected block and list
      const itemIdSelected = dataSelected.findIndex(function (element) {
        return element.idxData === el.idxData;
      });

      if (itemIdSelected !== -1) {
        dataSelected[itemIdSelected].unread = false;
        ContrSelected.update(itemIdSelected, dataSelected[itemIdSelected]);

        if (isHideRead) {
          ContrSelected.splice(itemIdSelected, 1);
        }
      }

      // update Menu block and list
      if (typeof dataMenu[itemId] !== 'undefined') {
        dataMenu[itemId].countUnread -= 1;

        if (isHideRead) {
          dataMenu[itemId].count -= 1;
        }

        if (dataMenu[itemId].count === 0) {
          ContrMenu.splice(itemId, 1);
        } else {
          ContrMenu.update(itemId, dataMenu[itemId]);
        }
      }

      // update curCurGroupsData
      const dataGroups = ContrGroups.getCurGroupsData();
      const newDataGroups = dataGroups.map((group) => {
        let res = filterMap(
          (oElem) => {
            return !isHideRead;
          },
          (oElem) => {
            if (oElem.id === el.id) {
              oElem.unread = false;
            }
            return oElem;
          }
        );

        return res(group);
        // return group.map((oElem) => {
        //   if (!isHideRead) {
        //     if (oElem.id === el.id) {
        //       oElem.unread = false;
        //     }
        //     return oElem;
        //   }
        // });
      });
      ContrGroups.setCurGroupsData(newDataGroups);
    }
  }
}

function filterMap(filterFn, mapFn) {
  return arr => {
    const newArr = [];
    for (let x of arr) {
      if (filterFn(x)) newArr.push(mapFn(x));
    }
    return newArr;
  };
}

function setTitleSelected(data) {
  if (typeof data === 'string' && data === 'clear') {
    $('.title-selected').text('');
    $('.time-selected').text('');
  } else {
    if (data.typeAction.name !== 'followed') {
      $('.title-selected')
        .text(`+${data.count} ${data.typeAction.name} by ${data.savedEvents[0].name}`);
    } else {
      $('.title-selected')
        .text(`+${data.count} ${data.typeAction.name}`);
    }

    const startTime = GroupsController.getTimeFormat(data.saveFirstDate);
    const lastId = data.savedEvents.length - 1;
    const lastTime = GroupsController.getTimeFormat(data.savedEvents[lastId].timestamp);
    $('.time-selected').text(`${startTime} - ${lastTime}`);
  }
}

function setApplyFilter() {
  ContrGroups.optionsVal = optionsNotif;

  if (ContrGroups.applyFilter(isLoading)) {
    ContrMenu.set(ContrGroups.curDataVal, true);
    isLoading.v = false;

    setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);
  }

  ContrSelected.set([], true);
  ContrGroups.setCurSelectedGroupId({ id: -1, itemId: -1 });
  $('.title-selected').text('');
  $('.time-selected').text('');
}

async function scrollEnd(ev) {
  if ($(ev).attr('class') === 'panel-with-menu') {
    if (await ContrGroups.getPageNotifs(isLoading)) {
      ContrMenu.splice(ContrMenu.getData().length - 1, 1, ContrGroups.curDataVal);
      isLoading.v = false;

      setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);
    }

    if (ContrGroups.getIsNeedRelSel()) {
      ContrSelected.set(ContrGroups.getCurGroupsData()[ContrGroups.getCurSelectedGroupId().id]);
      ContrGroups.setIsNeedRelSel(false);

      const data = ContrMenu.getData()[ContrGroups.getCurSelectedGroupId().itemId];
      setTitleSelected(data);

      setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);
    }
  }
}

function scrollPanelNext(ev) {
  if ($(ev).attr('class') === 'panel-with-menu') {
    setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);
  } else if ($(ev).attr('class') === 'panel-with-selected') {
    setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);
  }
}

$.fn.exists = function () {
  return $(this).length;
};

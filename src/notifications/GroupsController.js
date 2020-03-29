import * as $ from 'jquery';
import { sleep, clone } from './helpers.js';
var moment = require('moment');

// обновить lastGroupNotifs и lastAction после прочтения уведомления

/**
*
* @class GroupsController
*/
class GroupsController {
  constructor(options, cacheMini, selected, date = '') {
    // исходные уведомления (до обработки)
    this.baseData = [];
    this.allBuildedData = [];
    this.buildedData = [];
    // текущии собранные в группы уведомления (после обработки) (!только группы)
    this.curGroupsData = [];
    this.options = options;
    this.selected = selected;
    this.cacheMiniatures = cacheMini;

    this.lastAction = '';
    this.lastGroupNotifs = {
      isEmpty: true,
      list: [],
      typeAction: [],
      count: 0,
      countUnread: 0,
      savedEvents: [],
      idGroup: 0,
      saveFirstDate: '',
      reset: function (isNew = false) {
        this.isEmpty = true;
        this.list = [];
        this.typeAction = [];
        this.count = 0;
        this.countUnread = 0;
        this.savedEvents = [];
        this.saveFirstDate = '';
        if (isNew) {
          this.idGroup = 0;
        } else {
          this.idGroup += 1;
        }
      },
    };

    this.isEmptyCurPage = this.lastGroupNotifs.isEmpty;
    this.curSelectedGroupId = {
      id: -1,
      itemId: -1,
    };
    // need reload selected group
    this.isNeedRelSel = false;

    this.curPage = {
      val: 1,
      get v() {
        return this.val;
      },
      set v(b) {
        this.val = b;
        $('.cur-page > p').text(b - 1);
      },
    };

    this.today = {
      val: '',
      get v() {
        return this.val;
      },
      set v(b) {
        this.val = b;
        $('.cur-time > p').text(`${GroupsController.getTimeFormat(b)}`);
      },
    };

    if (date === '') {
      this.today.v = GroupsController.setCurDate();
    } else {
      this.today.v = date;
    }

    this.blConst = GroupsController.blConst();
    this.types = GroupsController.types;
  }

  get curDataVal() {
    return this.buildedData;
  }

  /**
   * Returns notification group by `id`
   * @param {number} id
   * @returns { object } `el` - the element itself, `i` - item index in `buildedData`
   * @memberof GroupsController
   */
  getGroupById(id) {
    return this.allBuildedData.find((el, i, arr) => {
      if (el?.idGroup === id) {
        return { el, i };
      }
      return false;
    });
  }

  get dataObj() {
    return this.baseData;
  }

  set curPageVal(val) {
    this.curPage.v = val;
  }

  set optionsVal(val) {
    this.options = val;
  }

  get optionsVal() {
    return this.options;
  }

  set todayVal(val) {
    this.today.v = val;
  }

  get todayVal() {
    return this.today.v;
  }

  getCurSelectedGroupId() {
    return this.curSelectedGroupId;
  }

  setCurSelectedGroupId(obj) {
    this.curSelectedGroupId = obj;
    this.selected.attr('group-id', obj.id);
  }

  getIsNeedRelSel() {
    return this.isNeedRelSel;
  }

  setIsNeedRelSel(bool) {
    this.isNeedRelSel = bool;
  }

  getCurCountSend() {
    return this.curCountSend;
  }

  updateData(id, prop, val) {
    this.baseData[id][prop] = val;
  }

  updateLastGroupNotifs(data) {
    if (this.lastGroupNotifs.idGroup === data.idGroup || this.lastGroupNotifs.idGroup === data) {
      if (typeof data === 'number') {
        this.lastGroupNotifs.reset();
      } else {
        this.lastGroupNotifs.list = data.list;
        this.lastGroupNotifs.count = data.count;
        this.lastGroupNotifs.countUnread = data.countUnread;
        this.lastGroupNotifs.savedEvents = data.savedEvents;
      }
    }
  }

  updateLastAction(action) {
    if (this.lastAction.id === action.id || this.lastAction.id === action) {
      if (typeof data === 'number') {
        this.lastAction = '';
      } else {
        this.lastAction.unread = action.unread;
      }
    }
  }

  async getPageNotifs(oIsLoading) {
    if (oIsLoading.v) {
      return false;
    }

    oIsLoading.v = true;

    this.buildedData = [];
    this.curCountSend = 0;

    const page = await GroupsController.getResBc({
      url: `https://www.belacam.com/api/notifications/?from=${this.today.v}&page=${this.curPage.v}`,
      type: 'GET',
    });

    const data = page?.results;

    if (data) {
      this.isEmptyCurPage = this.lastGroupNotifs.isEmpty;

      $.each(data, (i, oItem) => {
        oItem.idxData = this.baseData.length;
        oItem.idGroup = -1;
        this.baseData.push(oItem);
        this.scanData(oItem);
      });

      this.theEndGroup();

      // console.log('this curData ->', this.curData);
      // ContrMenu.splice(ContrMenu.getData().length - 1, 1, this.curData);

      console.log('curData', this.buildedData.cln());
      console.log('All buildedData', this.allBuildedData.cln());
      console.log('baseData', this.baseData.cln());

      this.curPage.v += 1;
      // this.isLoading.v = false;

      // setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);

      return true;
    }

    return false;
  }

  applyFilter(oIsLoading) {
    if (oIsLoading.v) {
      return false;
    }

    oIsLoading.v = true;

    if (this.baseData !== []) {
      this.lastAction = '';
      this.buildedData = [];
      this.allBuildedData = [];
      this.curGroupsData = [];
      this.curCountSend = 0;
      this.curSelectedGroupId = { id: -1, itemId: -1 };

      this.lastGroupNotifs.reset(true);

      this.isEmptyCurPage = this.lastGroupNotifs.isEmpty;

      console.log('applyFilter');

      $.each(this.baseData, (i, item) => {
        this.scanData(item);
      });

      this.theEndGroup();

      // ContrMenu.set(this.curData, true);

      console.log('buildedData', this.buildedData.cln());
      console.log('All buildedData', this.allBuildedData.cln());
      console.log('baseData', this.baseData.cln());

      // this.isLoading.v = false;

      // setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures);

      return true;
    }

    return false;
  }

  scanData(oCurentAction) {
    const type = GroupsController.getNameCssForAction(oCurentAction);

    try {
      const input = this.options['bool-event'][type.namePanel];
      const unread = this.options['bool-event']['hide-read'] && !oCurentAction.unread;
      const actor = this.options['value-input']['only-actor'] !== oCurentAction.actor && this.options['value-input']['only-actor'] !== '';

      if (input || unread || actor) {
        oCurentAction.idGroup = -1;
        return;
      }
    } catch (error) {
      console.log(error);
    }

    const typeCur = GroupsController.getNameCssForAction(oCurentAction).name;
    const typeLast = GroupsController.getNameCssForAction(this.lastAction).name;

    const curActionLike = GroupsController.compareVar(typeCur, typeLast, 'followed')
      || GroupsController.compareVar(typeCur, typeLast, 'deleted')
      || (GroupsController.compareVar(typeCur, typeLast, 'liked')
        && this.lastAction.actor === oCurentAction.actor)
      || (GroupsController.compareVar(typeCur, typeLast, 'commented')
        && this.lastAction.actor === oCurentAction.actor)
      || (GroupsController.compareVar(typeCur, typeLast, 'tagged')
        && this.lastAction.actor === oCurentAction.actor);

    if (curActionLike) {
      if (this.lastGroupNotifs.isEmpty) {
        this.lastGroupNotifs.isEmpty = false;
        this.lastGroupNotifs.typeAction = GroupsController.getNameCssForAction(oCurentAction);

        this.lastGroupNotifs.count = 1;

        if (this.lastAction.unread) {
          this.lastGroupNotifs.countUnread += 1;
        }

        // сохранение первого уведомлений для табла
        this.pushSavedEvents(this.lastAction);
        this.lastGroupNotifs.list.push(this.converSimple(this.lastAction));
        this.lastGroupNotifs.saveFirstDate = this.lastAction.timestamp;
        // save idGroup action
        this.lastAction.idGroup = this.lastGroupNotifs.idGroup;
      }

      this.lastGroupNotifs.list.push(this.converSimple(oCurentAction));
      this.lastGroupNotifs.count += 1;
      // save idGroup action
      oCurentAction.idGroup = this.lastGroupNotifs.idGroup;

      if (oCurentAction.unread) {
        this.lastGroupNotifs.countUnread += 1;
      }

      // сохранение первых уведомлений для табла
      this.pushSavedEvents(oCurentAction);
    } else {
      this.trainingEndGroup();
    }

    this.lastAction = oCurentAction;
  }

  trainingEndGroup() {
    if (this.lastGroupNotifs.isEmpty) {
      if (this.lastAction !== '') {
        this.addSimple(this.lastAction);
      }
    } else {
      this.theEndGroup();
      this.lastGroupNotifs.reset();
    }
  }

  theEndGroup() {
    if (!this.lastGroupNotifs.isEmpty && this.lastGroupNotifs.count > 0) {
      let groupId = this.lastGroupNotifs.idGroup;
      const lastGroupNotifs = this.lastGroupNotifs.cln();

      const newGroup = lastGroupNotifs;
      newGroup.type = 'group';
      newGroup.id = groupId;

      if (!this.isEmptyCurPage) {
        const index = this.buildedData.length - 1;
        this.buildedData.splice(index, 1, lastGroupNotifs);
        this.allBuildedData.splice(this.allBuildedData.length - 1, 1, lastGroupNotifs);
        this.isEmptyCurPage = true;
      } else {
        this.buildedData.push(lastGroupNotifs);
        this.allBuildedData.push(lastGroupNotifs);
      }

      if (this.curSelectedGroupId.id === groupId) {
        this.isNeedRelSel = true;
      }

      this.curCountSend += this.lastGroupNotifs.count;
    } else if (this.lastAction !== '') {
      this.addSimple(this.lastAction);
    }
  }

  addSimple(action) {
    this.buildedData.push(this.converSimple(action));
    this.allBuildedData.push(this.converSimple(action));
    this.curCountSend += 1;
  }

  converSimple(curentAction) {
    const typeAction = GroupsController.getNameCssForAction(curentAction);

    let srcMini = '';

    if (typeAction.name === 'liked' || typeAction.name === 'commented') {
      if (this.cacheMiniatures.v.has(curentAction.action_id.toString())) {
        srcMini = this.cacheMiniatures.v.get(curentAction.action_id.toString());
      }
    }

    return {
      type: 'single',
      typeAction,
      unread: curentAction.unread,
      actor: curentAction.actor,
      username: curentAction.username,
      action_id: curentAction.action_id,
      srcMini,
      id: curentAction.id,
      actorThumbnail: curentAction.actor_thumbnail.match(/src='(.*)'/)[1],
      timestamp: curentAction.timestamp,
      idxData: curentAction.idxData,
    };
  }

  pushSavedEvents(action) {
    this.lastGroupNotifs.savedEvents.push({
      name: action.actor,
      img: action.actor_thumbnail.match(/src='(.*)'/)[1],
      id: action.id,
      timestamp: action.timestamp,
    });
  }

  static fill(obj, data) {
    const item = obj;

    if ($(obj)[0].nodeName === '#document-fragment') {
      item.append(GroupsController.blConst());
    } else {
      // empty
    }

    GroupsController.editItem(item, data);

    return item;
  }

  static update(obj, data) {
    GroupsController.editItem(obj, data);
  }

  static editItem(item, data) {
    let con = $(item).find('.con-notif');

    if (con.length === 0) {
      con = item;
    }

    $(item).find('.visible').removeClass('visible');
    $(item).find('.visible-blur').removeClass('visible-blur');
    $(item).find('img').attr('onload', 'onloadImg(this);');

    if (data.type === 'single') {
      con.attr('index-data', data.idxData);

      if (data.unread) {
        $(item).find('.con-reading').removeClass('disabled');
      } else {
        $(item).find('.con-reading').addClass('disabled');
      }

      con.removeAttr('group-id');

      $(item).find('.content-title').attr('data-user', data.actor).text(data.actor);

      let url = '';

      if (data.typeAction.name === 'liked' || data.typeAction.name === 'commented') {
        url = `https://www.belacam.com/post/${data.username}/${data.action_id}`;

        $(item).find('.con-photo img').attr('action-id', data.action_id);

        if (data.srcMini !== '') {
          $(item).find('.con-photo img').attr('src', data.srcMini);
        } else {
          $(item).find('.con-photo img').attr('src', '');
        }

        con.attr({
          class: `con-notif single-photo ${data.typeAction.name}`,
        });
      } else {
        $(item).find('.con-photo img').removeAttr('action-id');

        con.attr({
          class: `con-notif single ${data.typeAction.name}`,
        });

        if (data.typeAction.name === 'tagged') {
          url = `https://www.belacam.com/post/${data.username}/${data.action_id}`;
        } else if (data.typeAction.name === 'followed') {
          url = `https://www.belacam.com/user/${data.actor}`;
        } else if (data.typeAction.name === 'deleted') {
          url = '#';
        }
      }

      if (data.typeAction.name !== 'deleted') {
        con.attr({
          href: url,
        });
      } else {
        con.removeAttr('href');
      }

      if (data.srcMini === '') {
        $(item).find('.con-blur img').attr('src', `${data.actorThumbnail}`);
      } else {
        $(item).find('.con-blur img').attr('src', `${data.srcMini}`);
      }

      $(item).find('.con-avatar img').attr('src', data.actorThumbnail);
      $(item).find('.con-avatar').attr('href', `https://www.belacam.com/user/${data.actor}`);

      $(item).find('.content-time').text(
        GroupsController.getTimeFormat(data.timestamp),
      );
    } else if (data.type === 'group') {
      con.removeAttr('index-data');
      $(item).find('.con-avatar').removeAttr('href');

      $(item).find('.con-photo img').removeAttr('action-id');
      // $(item).find('.con-photo img').attr('action-id');

      if (data.countUnread > 0) {
        $(item).find('.con-reading').removeClass('disabled');
      } else {
        $(item).find('.con-reading').addClass('disabled');
      }

      $(item).find('.con-num-notif > p').text(data.count);

      con.attr({
        'group-id': data.id,
        class: `con-notif group ${data.typeAction.name}`,
      });

      if (data.typeAction.name === 'followed') {
        $(item).find('.content-title').removeAttr('data-user').text(`${data.savedEvents[0].name} and other`);
      } else {
        $(item).find('.content-title').removeAttr('data-user').text(`${data.savedEvents[0].name}`);
      }

      con.removeAttr('href');

      const startTime = GroupsController.getTimeFormat(data.saveFirstDate);
      const lastId = data.savedEvents.length - 1;
      const lastTime = GroupsController.getTimeFormat(data.savedEvents[lastId].timestamp);

      $(item).find('.content-time').text(`${startTime} - ${lastTime}`);
    }
  }

  static getTimeFormat(t) {
    return moment(t) // eslint-disable-line
      .locale('ru')
      .format('D MMM, H:mm');
  }

  static blConst() {
    return $('<a>', {
      class: 'con-notif',
      target: '_blank',
      append: $('<div>', {
        class: 'con-blur',
        append: $('<img>', {
          src: '',
          alt: '',
          onload: 'onloadImg(this);',
        }),
      })
        .add($('<a>', {
          class: 'con-avatar',
          target: '_blank',
          append: $('<div>', {
            class: 'con-num-notif',
            append: $('<p>', {
              text: '-1',
            }),
          })
            .add($('<img>', {
              src: '',
              alt: '',
              onload: 'onloadImg(this);',
            })),
        }))
        .add($('<div>', {
          class: 'con-content clearfix',
          append: $('<div>', {
            class: 'content-vert-align',
            append: $('<h5>', {
              class: 'content-title',
              text: 'Perfect name',
            })
              .add($('<br>'))
              .add($('<h6>', {
                class: 'content-time',
                text: 'Exact time',
              })),
          }),
        }))
        .add($('<div>', {
          class: 'con-photo',
          append: $('<img>', {
            src: '',
            alt: '',
            onload: 'onloadImg(this);',
          }),
        }))
        .add($('<div>', {
          class: 'con-reading',
          append: $('<div>', {
            class: 'reading-bubble',
          }),
        })),
    });
  }

  static getNameCssForAction(action) {
    const actionType = GroupsController.types[action.verb];

    if (actionType) {
      if ($.inArray(action.action, actionType.type) !== -1) {
        return actionType;
      }

      if (action.action === 'nonetype') {
        return GroupsController.types.nonetype;
      }
    }
    return GroupsController.types.none;
  }

  static setCurDate() {
    let today = new Date();
    today.setHours(today.getHours() - 3);
    // eslint-disable-next-line no-undef
    today = GroupsController.formatDate(today);
    return today;
  }

  static async getResBc(obj) {
    return new Promise((resolve) => {
      chrome.tabs.query({ url: 'https://www.belacam.com/*' }, (tabs) => {
        console.log(tabs, obj);
        if (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { greeting: obj }, (res) => {
            resolve(res);
          });
        }
      });
    });
  }

  static formatDate(date) {
    let dd = date.getDate();
    if (dd < 10) dd = `0${dd}`;

    let mm = date.getMonth() + 1;
    if (mm < 10) mm = `0${mm}`;

    const yy = date.getFullYear();

    let hh = date.getHours();
    if (hh < 10) hh = `0${hh}`;

    let mi = date.getMinutes();
    if (mi < 10) mi = `0${mi}`;

    let ss = date.getSeconds();
    if (ss < 10) ss = `0${ss}`;

    let mmi = date.getMilliseconds();
    if (mmi < 10) mmi = `0${mmi}`;

    return `${yy}-${mm}-${dd}T${hh}:${mi}:${ss}.${mmi}Z`;
  }

  static compareVar(num1, num2, num3) {
    if (num1 === num2 && num2 === num3) {
      return true;
    }
    return false;
  }

  static async markItRead(idAction, isRead = false, time = 1000) {
    let res = {};

    if (isRead) {
      res = await GroupsController.getResBc({
        url: `https://www.belacam.com/api/mark_it_read/${idAction}/`,
        type: 'GET',
        dataType: 'json',
      });
    } else {
      await sleep(time);
      res = { success: true };
    }

    return res;
  }
}


GroupsController.types = {
  none: {
    type: ['none'],
    name: 'none',
    namePanel: 'none',
    color: 'grey',
    forAction: 'none',
  },
  nonetype: {
    type: ['nonetype'],
    name: 'deleted',
    namePanel: 'hide-deleted',
    color: 'grey',
    forAction: 'удаленных',
  },
  ' has followed you!': {
    type: ['user'],
    name: 'followed',
    namePanel: 'hide-followers',
    color: 'green',
    forAction: 'подписок',
  },
  ' has liked your post!': {
    type: ['bella'],
    name: 'liked',
    namePanel: 'hide-likes',
    color: 'pink',
    forAction: 'лайков',
  },
  ' has commented on your post!': {
    type: ['comment'],
    name: 'commented',
    namePanel: 'hide-comments',
    color: 'blue',
    forAction: 'комментариев',
  },
  ' tagged you in a post': {
    type: ['comment', 'bella'],
    name: 'tagged',
    namePanel: 'hide-tagged',
    color: 'purple',
    forAction: 'упоминаний',
  },
};

export default GroupsController;

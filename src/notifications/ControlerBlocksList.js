
import * as $ from 'jquery';
import { define } from './helpers.js';

class ControlerBlocksList {
  constructor(data, height, amountBl, con, list, fillItem, endList = null,
    topList = null, nextItem = null, prevItem = null, updateItem = null) {
    this.data = data;

    this.con = con;
    this.list = list;

    this.amountBl = amountBl;
    this.height = height;
    this.scrollStep = this.height * 2;

    this.fillItem = fillItem;
    this.updateItem = updateItem;
    this.endList = endList;
    this.topList = topList;
    this.nextItem = nextItem;
    this.prevItem = prevItem;

    this.heightCon = 0;
    this.heightList = 0;
    this.oldData = [];
    this.scopeList = [];

    this.mousewheel();
    this.resWin();
  }

  getData() {
    return this.data;
  }

  generateBl() {
    const frag = $(document.createDocumentFragment());

    for (let key = 0; key < this.data.length && key < this.amountBl; key += 1) {
      const item = ControlerBlocksList.clonBl(key);
      item.append(this.fillItem($(document.createDocumentFragment()), this.data[key]));
      frag.append(item);
    }

    this.list.append(frag);
    this.updateVisibleItems();

    this.heightCon = $(this.con).outerHeight();
    this.heightList = $(this.list).outerHeight();
  }

  set(items, isAtFirst = false) {
    this.oldData = this.data.clone();
    this.data = items.clone();

    if (isAtFirst) {
      this.scopeList[0].id = 10e10;
      this.scopeList[1].id = 10e10;
    }
    this.updateVisible('set Data');
  }

  add(items) {
    this.oldData = this.data.clone();
    this.data = this.data.concat(items);

    this.addAfter();
  }

  push(items) {
    this.oldData = this.data.clone();
    this.data = items.concat(this.data);

    const itemsMenu = this.list.children('.item-menu');

    if (itemsMenu.length > 0) {
      for (let key = 0; key < itemsMenu.length; key++) {
        const item = $(itemsMenu[key]);
        const itemId = item.attr('item');

        item.html(this.fillItem($(item.children()), this.data[itemId]));
      }
    }

    if (itemsMenu.length < this.amountBl) {
      const frag = $(document.createDocumentFragment());
      const startKey = this.scopeList[1].id + 1;

      for (let key = startKey; key < this.data.length && key < this.amountBl; key++) {
        const item = ControlerBlocksList.clonBl(key);
        item.append(this.fillItem($(document.createDocumentFragment()), this.data[key]));
        frag.append(item);
      }

      this.list.append(frag);


      this.heightCon = $(this.con).outerHeight();
      this.heightList = $(this.list).outerHeight();
      this.updateVisibleItems();
    }
  }

  splice(index, deleteCount, items) {
    this.oldData = this.data.clone();

    if (typeof items !== 'undefined') {
      this.data.splice(index, deleteCount, ...items);
      this.updateVisible('splice1 Data');
    } else {
      this.data.splice(index, deleteCount);
      this.updateVisible('splice2 Data');
    }
  }

  insert(index, items) {
    this.oldData = this.data.clone();

    this.data.splice(index, 0, ...items);

    if (index <= this.scopeList[1].id) {
      this.updateVisible('insert Data');
    }
  }

  update(index, item) {
    this.oldData = this.data.clone();

    this.data.splice(index, 1, item);

    if (index <= this.scopeList[1].id && index >= this.scopeList[0].id) {
      const elem = this.list.children(`[item=${index}]`);

      this.updateItem(elem, this.data[index]);
    }
  }

  // supporting
  updateVisible(errText) {
    let isLastItem = this.data.length === this.scopeList[0].id
      && this.data.length === this.scopeList[1].id
      && this.data.length === 0;

    if (this.data.length > this.scopeList[1].id) {
      for (let key = this.scopeList[0].id; key <= this.scopeList[1].id; key += 1) {
        if (!ControlerBlocksList.deepEqual(this.data[key], this.oldData[key])) {
          const item = this.list.children(`[item=${key}]`);
          item.html(this.fillItem($(item.children()), this.data[key]));
        }
      }

      this.addAfter();
    } else if (this.data.length > this.scopeList[0].id) {
      const listForDel = $([]);
      for (let key = this.scopeList[1].id; key >= this.scopeList[0].id; key -= 1) {
        if (typeof this.data[key] === 'undefined') {
          listForDel.push(this.list.children(`[item=${key}]`).get(0));
        } else if (this.data.length - 1 < key) {
          this.scrollingUp(0);
        } else if (!ControlerBlocksList.deepEqual(this.data[key], this.oldData[key])) {
          const item = this.list.children(`[item=${key}]`);

          item.html(this.fillItem($(item.children()), this.data[key]));
        }
      }

      if (listForDel.length > 0) {
        listForDel.remove();
      }

      this.updateVisibleItems();
      this.heightList = $(this.list).outerHeight();
    } else if (this.data.length < this.scopeList[0].id || isLastItem) {
      this.list.children().remove();
      this.generateBl();
      $(this.list).css('margin-top', `${0}px`);
    } else {
      console.error('[PLUGIN]', errText, this.data, this.oldData);
    }
  }

  // supporting
  addAfter() {
    if (this.data.length - 1 > this.scopeList[1].id || this.data.length === 0) {
      const frag = $(document.createDocumentFragment());
      const startKey = this.scopeList[1].id + 1;

      for (let key = startKey; key < this.data.length && key < this.amountBl; key++) {
        const item = ControlerBlocksList.clonBl(key);
        item.append(this.fillItem($(document.createDocumentFragment()), this.data[key]));
        frag.append(item);
      }

      this.list.append(frag);

      this.updateVisibleItems();
      this.heightCon = $(this.con).outerHeight();
      this.heightList = $(this.list).outerHeight();
    }
  }

  updateVisibleItems() {
    const firstItem = this.list.children(':first');
    const lastItem = this.list.children(':last');
    const firstId = parseInt(firstItem.attr('item'), 10);
    const lastId = parseInt(lastItem.attr('item'), 10);

    if (firstItem.length === 0 && lastItem.length === 0) {
      this.scopeList = [
        {
          id: -1,
          item: 'undefined',
        }, {
          id: -1,
          item: 'undefined',
        },
      ];

      return;
    }

    const rez = lastId - firstId + 1;

    if (rez > this.amountBl || rez < 0) {
      console.error('[PLUGIN]', 'updateVisibleItems', rez);
    }

    if (firstId === lastId) {
      this.scopeList = [
        {
          id: firstId,
          item: firstItem,
        },
        {
          id: firstId,
          item: firstItem,
        },
      ];
    } else {
      this.scopeList = [
        {
          id: firstId,
          item: firstItem,
        }, {
          id: lastId,
          item: lastItem,
        },
      ];
    }
  }

  mousewheel() {
    this.con.on('mousewheel', (e) => {
      if (e.originalEvent.wheelDelta / 120 > 0) {
        this.scrollingUp(0);
      } else {
        this.scrollingDown(0);
      }
    });
  }

  scrollingUp(height) {
    if (parseInt(this.list.css('margin-top'), 10) < 0) {
      let mewTop = parseInt(this.list.css('margin-top'), 10) + this.scrollStep;

      if (mewTop > 0) {
        mewTop = 0;
      }

      $(this.list).css('margin-top', `${mewTop}px`);
    } else {
      const firstId = this.scopeList[0].id;

      if (firstId > 0) {
        const lastItem = this.scopeList[1].item;

        lastItem.attr('item', firstId - 1);
        lastItem.html(this.fillItem($(lastItem.children()), this.data[firstId - 1]));
        lastItem.prependTo(this.list);

        if (this.prevItem !== null) {
          this.prevItem(this.con);
        }

        this.updateVisibleItems();

        const newHeight = height + $(lastItem).outerHeight();

        if (newHeight < this.scrollStep) {
          this.scrollingUp(newHeight);
        }
      } else if (this.topList !== null) {
        this.topList(this.con);
      }
    }
  }

  scrollingDown(height) {
    if (this.heightCon - this.heightList < parseInt(this.list.css('margin-top'), 10)) {
      let mewTop = parseInt(this.list.css('margin-top'), 10) - this.scrollStep;

      if (this.heightCon - this.heightList > mewTop) {
        mewTop = this.heightCon - this.heightList;
      }

      $(this.list).css('margin-top', `${mewTop}px`);
    } else {
      const lengthData = this.data.length;
      const lastId = this.scopeList[1].id;

      if (lengthData > lastId + 1) {
        const firstItem = this.scopeList[0].item;

        firstItem.attr('item', lastId + 1);
        firstItem.html(this.fillItem($(firstItem.children()), this.data[lastId + 1]));
        firstItem.appendTo(this.list);

        if (this.nextItem !== null) {
          this.nextItem(this.con);
        }

        this.updateVisibleItems();

        const newHeight = height + $(firstItem).outerHeight();

        if (newHeight < this.scrollStep) {
          this.scrollingDown(newHeight);
        }
      } else if (this.endList !== null) {
        this.endList(this.con);
      }
    }
  }

  resWin() {
    $(window).resize(() => {
      this.heightCon = $(this.con).outerHeight();
    });
  }

  static clonBl(id) {
    return $('<li>', {
      class: 'item-menu',
      item: id,
    });
  }

  static deepEqual(a, b) {
    if (a === b) {
      return true;
    }
    if (a == null || typeof (a) !== 'object' || (b == null && typeof (b) !== 'object')) {
      return false;
    }

    let equal = true;
    // eslint-disable-next-line no-restricted-syntax
    for (const key in a) {
      if (typeof (a) === 'object' && typeof (b) === 'object') {
        if (!ControlerBlocksList.deepEqual(a[key], b[key])) {
          equal = false;
        }
      } else if (a !== b) {
        equal = false;
      }
    }
    return equal;
  }
}

export default ControlerBlocksList;

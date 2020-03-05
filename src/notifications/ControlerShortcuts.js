import * as $ from 'jquery';

export default class ControlerShortcuts {
  constructor(ev2, w = window) {
    this.window = w;
    this.keydown = [];
    this.ev2 = ev2;

    this.keydownL();
    this.keyupL();
    this.focusoutL();
  }

  keydownL() {
    $(this.window).keydown((event) => {
      const ind = this.keydown.indexOf(event.keyCode);

      if (ind === -1) {
        this.keydown.push(event.keyCode);

        if (this.keydown.length === 2) {
          this.ev2(this.keydown);
        } else {
          // console.log('----', this.keydown);
        }
      }
    });
  }

  keyupL() {
    $(this.window).keyup((event) => {
      const ind = this.keydown.indexOf(event.keyCode);

      if (ind !== -1) {
        this.keydown.splice(ind, 1);
      } else {
        console.log(`Массив не содержит значение ${event.keyCode}`);

        this.keydown = [];
      }
    });
  }

  focusoutL() {
    $(this.window).on('focusout', (event) => {
      this.keydown = [];
    });
  }
}

import * as $ from 'jquery';

class CreatorPupopController {
  constructor() {
    this.divItems = $('<div>', {
      class: 'bc-main',
    });
    this.storageItems = [];
    this.curItem = '';
    this.divGroupItems = $([]);
    this.configurationDivGroupItems = {
      isEmpty: true,
      name: '',
    };

    this.constCheckBox = CreatorPupopController.createCheckBox();
    this.constGroupCheckBox = CreatorPupopController.createGroupCheckBox();
  }

  controller(item) {
    this.curItem = item;

    if (item.type === 'globalInput') {
      this.endGroup();

      const input = this.createNewInput('bc-global-inputs input-none');
      input.appendTo(this.divItems);
    }

    if (item.type === 'input') {
      const input = this.createNewInput('bc-inputs input-none');

      const groupIsEmpty = this.configurationDivGroupItems.isEmpty;
      const groupName = this.configurationDivGroupItems.name;
      const itemName = item.inputType.name;
      const itemType = item.inputType.type;

      if (!groupIsEmpty) {
        if (itemType !== 'radio') {
          // окончание группы + следующий НЕ radio
          this.endGroup();
          input.appendTo(this.divItems);
        }

        if (itemType === 'radio') {
          if (itemName !== groupName) {
            // окончание группы + следующий radio с другим name
            this.endGroup();
            this.createNewGroup(input, itemName);
          } else {
            // если группа продолжается
            input.appendTo(this.divGroupItems);
          }
        }
      }

      if (groupIsEmpty) {
        if (itemType === 'radio') {
          // создаем новую группу
          this.createNewGroup(input, itemName);
        } else {
          input.appendTo(this.divItems);
        }
      }
    }

    if (item.type === 'title') {
      this.endGroup();

      $('<span>', {
        text: item.nameGroup,
        class: 'bc-title-name-group',
      }).appendTo(this.divItems);
    }

    if (item.type === 'button') {
      this.endGroup();

      $('<button>', {
        text: item.h1,
        id: item.id,
        nameFun: item.nameFun,
      }).appendTo(this.divItems);
    }

    if (item.type === 'text-input') {
      this.endGroup();

      $('<div>', {
        class: 'bc-text-inputs-div',
        append: $('<input>', {
          id: item.bcType,
          placeholder: item.placeholder,
          class: 'bc-text-inputs',
          val: this.storageItems.bcTypePanel['value-input'][item.bcType],
        }).add($('<label>', {
          text: item.h1,
          class: 'bc-text-inputs-label',
          for: item.bcType,
        })),
      }).appendTo(this.divItems);
    }
  }

  endGroup() {
    if (!this.configurationDivGroupItems.isEmpty) {
      this.divGroupItems.appendTo(this.divItems);
      this.clearGroup();
    }
  }

  createNewGroup(input, itemName) {
    this.divGroupItems = this.constGroupCheckBox.clone(true);
    this.configurationDivGroupItems = {
      isEmpty: false,
      name: itemName,
    };

    input.appendTo(this.divGroupItems);
  }

  clearGroup() {
    this.divGroupItems = $([]);
    this.configurationDivGroupItems = {
      isEmpty: true,
      name: '',
    };
  }

  createNewInput(inputClass) {
    const locClone = this.constCheckBox.clone(true);

    locClone.filter('input').attr({
      type: this.curItem.inputType.type,
      name: this.curItem.inputType.name,
      typeObj: this.curItem.typeObj,
      class: inputClass,
      id: `bc-checkbox-${this.curItem.bcType}`,
      'bc-type': this.curItem.bcType,
    }).prop('checked', this.storageItems.bcTypePanel[this.curItem.typeObj][this.curItem.bcType]);

    locClone.filter('label').attr({
      for: `bc-checkbox-${this.curItem.bcType}`,
    });

    locClone.find('h1').text(this.curItem.h1);

    return locClone;
  }

  setStorageItems(items) {
    this.storageItems = items;
  }

  static createCheckBox() {
    return $('<input>', {
    }).add($('<label>', {
      for: '',
      class: 'bc-checkbox',
      append: $('<div>', {
        class: 'bc-row bc-checkbox-title',
        append: $('<h1>'),
      }).add($('<div>', {
        class: 'bc-row bc-checkbox-button',
        append: $('<div>', {
          class: 'bc-checkbox-con',
          append: $('<div>', {
            class: 'bc-checkbox-box',
          }).add($('<div>', {
            class: 'bc-checkbox-left',
            append: $('<p>', {
              text: 'off',
            }),
          })).add($('<div>', {
            class: 'bc-checkbox-right',
            append: $('<p>', {
              text: 'on',
            }),
          })),
        }),
      })),
    }));
  }

  static createGroupCheckBox() {
    return $('<div>', {
      class: 'bc-group-checkbox',
    });
  }
}

export default CreatorPupopController;

async function sleep(mm) {
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, mm);
  });
}

function filterMap(filterFn, mapFn) {
  return arr => {
    const newArr = [];
    let index = 0;
    for (let value of arr) {
      // console.log('index, value', index, value);
      if (filterFn(value, index, arr)) newArr.push(mapFn(value, index, arr));
      index += 1;
    }
    return newArr;
  };
}

const define = Object.defineProperties(Array.prototype, {
  clone: {
    enumerable: false,
    value: function () {
      return this.slice();
    },
  },
  jsonClone: {
    enumerable: false,
    value: function () {
      return JSON.parse(JSON.stringify(this));
    },
  },
});

export { sleep, filterMap, define };

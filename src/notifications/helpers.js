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

const clone = Object.defineProperties(Object.prototype, {
  cln: {
    enumerable: false,
    value: function () {
      if (Array.isArray(this)) {
        return this.slice();
      }

      if (typeof this === 'object') {
        return JSON.parse(JSON.stringify(this));
      }

      return 'error defineProperties';
    },
  },
});

export {
  sleep, filterMap, clone,
};

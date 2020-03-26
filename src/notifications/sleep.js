async function sleep(mm) {
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, mm);
  });
}

export default sleep;

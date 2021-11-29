export const threadPool = async (
  items: Array<any>,
  callback: any,
  max: number = 5,
) => {
  if (!items || items.length === 0) return;
  let promise = [];
  for (let i = 0; i < items.length; i++) {
    promise.push(items[i]);
    if (i % max === 0) {
      await Promise.all(promise.map((item) => callback(item)));
      promise = [];
    }
  }
  await Promise.all(promise.map((item) => callback(item)));
};

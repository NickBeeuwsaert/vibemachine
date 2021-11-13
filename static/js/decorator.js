export function reify(value) {
  const instanceMap = new WeakMap();
  return function () {
    if (!instanceMap.has(this)) {
      instanceMap.set(this, value.call(this));
    }
    return instanceMap.get(this);
  };
}

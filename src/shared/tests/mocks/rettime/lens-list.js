class LensList {
  #list;
  #lens;
  constructor() {
    this.#list = [];
    this.#lens = new Map();
  }
  get [Symbol.iterator]() {
    return this.#list[Symbol.iterator].bind(this.#list);
  }
  entries() {
    return this.#lens.entries();
  }
  get(key) {
    return this.#lens.get(key) || [];
  }
  getAll() {
    return this.#list.map(([, value]) => value);
  }
  append(key, value) {
    this.#list.push([key, value]);
    this.#openLens(key, (list) => list.push(value));
  }
  prepend(key, value) {
    this.#list.unshift([key, value]);
    this.#openLens(key, (list) => list.unshift(value));
  }
  delete(key, value) {
    if (this.size === 0) return false;
    const values = this.#lens.get(key);
    if (!values) return false;
    const index = values.indexOf(value);
    if (index === -1) return false;
    values.splice(index, 1);
    this.#list.splice(
      this.#list.findIndex((item) => item[0] === key && item[1] === value),
      1,
    );
    return true;
  }
  deleteAll(key) {
    if (this.size === 0) return;
    this.#list = this.#list.filter((item) => item[0] !== key);
    this.#lens.delete(key);
  }
  get size() {
    return this.#list.length;
  }
  clear() {
    if (this.size === 0) return;
    this.#list.length = 0;
    this.#lens.clear();
  }
  #openLens(key, setter) {
    setter(this.#lens.get(key) || this.#lens.set(key, []).get(key));
  }
}

module.exports = { LensList };

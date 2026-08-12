class Storage {
  static set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  static get(key, defaultValue = null) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }

  static remove(key) {
    localStorage.removeItem(key);
  }

  static clear() {
    localStorage.clear();
  }
}

function iniciarApp(){

}

iniciarApp();
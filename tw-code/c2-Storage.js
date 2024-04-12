
MT.computeSizes = () => {
  const mdKey = storage._prefix + "metadata";
  const ms = 2 * (mdKey.length + (localStorage.getItem(mdKey) ?? "").length);

  const ls = storageSize(localStorage);
  const ss = storageSize(sessionStorage);
  return `ss ${ss} + ls ${ls} (md ${ms})`;
}

/** @type {(st: Storage) => number} */
const storageSize = (st) => {
  let size = 0;
  for (let i = 0, n = st.length; i < n; i++) {
    const key = st.key(i) || "";
    const val = st.getItem(key) || "";
    size += key.length + val.length;
  }
  return 2 * size;
}
# three.js vendored build

Gallery-only dependency (`projects/index.html` is the sole consumer; the 9 project
detail pages never load it).

| item | value |
|---|---|
| version | r186 (0.186.1), `REVISION === "186"` |
| files | `three.module.min.js` (entry) → imports `./three.core.js` |
| source | <https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js> and `.../three.core.min.js` |
| upstream | npm three@0.186.1 tarball ships only the unminified `build/three.core.js` / `build/three.module.js`; the two files here are jsDelivr's Terser 5.48.0 minification of exactly those upstream files |
| license | MIT — see `LICENSE` |
| raw size | 393 KB + 416 KB (≈194 KB gzip over GitHub Pages) |

Re-vendoring:

```sh
npm pack three@0.186.1          # canonical upstream, for byte comparison
curl -O https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js
curl -o three.core.js https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.core.min.js
sed -i '/^\/\/# sourceMappingURL=\/sm\//d' three.module.min.js three.core.js
```

The trailing `//# sourceMappingURL=/sm/<hash>.map` lines are stripped: they point at
jsDelivr's site-root map URLs, which do not exist under GitHub Pages and would 404
whenever DevTools is open.

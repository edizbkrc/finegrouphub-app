/*
 * FineGroupHub <-> Canvas Harita Düzenleyici köprüsü.
 *
 * Bu dosya editörün İÇİNDE çalışır (/api/draw tarafından enjekte edilir) ve
 * paneldeki sayfa ile `postMessage` üzerinden konuşur.
 *
 * Editörün sözleşmesi (kaynağı okunarak doğrulandı):
 *   - `initializeData()`  #json-input içindeki metni okur ve sahneyi kurar
 *   - `exportJson()`      çizimi JSON'a çevirip yine #json-input'a yazar
 *   - `setBackgroundImage(e)` #image-input'un change olayından dosya okur
 * Üçü de window üzerinde; `data` / `jsonInput` gibi değişkenler değil, bu
 * yüzden köprü hep DOM ve bu üç fonksiyon üzerinden gider.
 *
 * Mesajlar
 *   panel -> editör : {type:"fgh:load", json, imageUrl}
 *                     {type:"fgh:request-save"}
 *   editör -> panel : {type:"fgh:ready"}
 *                     {type:"fgh:saved", json}
 *                     {type:"fgh:error", message}
 */
(function () {
  "use strict";

  var EMPTY = "[]";

  function send(message) {
    if (window.parent !== window) window.parent.postMessage(message, window.location.origin);
  }

  function textarea() {
    return document.getElementById("json-input");
  }

  function loadJson(json) {
    var box = textarea();
    if (!box) throw new Error("json-input bulunamadı");

    // Boş bırakılırsa editör localStorage'daki ÖNCEKİ çizime düşüyor
    // (initializeData'nın fallback'i) — yeni/boş kare için "[]" yazmak şart.
    box.value = json && String(json).trim() !== "" ? json : EMPTY;

    window.initializeData();
    if (typeof window.drawScene === "function") window.drawScene(false);
  }

  function loadBackground(url) {
    var input = document.getElementById("image-input");
    if (!input || !url) return Promise.resolve();

    return fetch(url, { mode: "cors", credentials: "omit" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.blob();
      })
      .then(function (blob) {
        var name = url.split("/").pop() || "frame.png";
        var file = new File([blob], name, { type: blob.type || "image/png" });
        var transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
  }

  function save() {
    window.exportJson();
    var box = textarea();
    send({ type: "fgh:saved", json: box ? box.value : EMPTY });
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    var payload = event.data;
    if (!payload || typeof payload.type !== "string") return;

    try {
      if (payload.type === "fgh:load") {
        loadJson(payload.json);
        if (payload.imageUrl) {
          loadBackground(payload.imageUrl).catch(function (error) {
            send({ type: "fgh:error", message: "Kare görseli yüklenemedi: " + error.message });
          });
        }
        return;
      }

      if (payload.type === "fgh:request-save") {
        save();
      }
    } catch (error) {
      send({ type: "fgh:error", message: error && error.message ? error.message : String(error) });
    }
  });

  function announce() {
    // Editörün kendi başlangıç kodu bitsin diye bir tur bekle.
    setTimeout(function () {
      send({ type: "fgh:ready" });
    }, 0);
  }

  document.addEventListener(
    "keydown",
    function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        send({ type: "fgh:escape" });
      }
    },
    true
  );

  if (document.readyState === "complete") announce();
  else window.addEventListener("load", announce);
})();

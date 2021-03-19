'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "f463f7981a7c74f065a6fdbd456f9c9d",
"assets/FontManifest.json": "ba7e83e36e7b6a266a0913286fcbb663",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/lib/assets/bani_blog.json": "9f4bc389668e5e1433c406e242e45d58",
"assets/lib/assets/flash_sales.json": "b488507c775cb01ca511e4b964ec3ca4",
"assets/lib/assets/fonts/IRANSansMobileFaNum-Black.ttf": "7eee3556cad54caaa9c240709f775e69",
"assets/lib/assets/fonts/IRANSansMobileFaNum-Bold.ttf": "c0196c974a06ffefa19e651baddebf3f",
"assets/lib/assets/fonts/IRANSansMobileFaNum-Light.ttf": "b32c65557db8be5c071cefbf7af03e8f",
"assets/lib/assets/fonts/IRANSansMobileFaNum-Medium.ttf": "526a6bd26539434715bc5587a513d716",
"assets/lib/assets/fonts/IRANSansMobileFaNum-UltraLight.ttf": "28387adefd8bee9ccc1ad4f60b25e8fb",
"assets/lib/assets/fonts/IRANSansMobileFaNum.ttf": "80470e5cc0dea2d75af2700d8c35ba6a",
"assets/lib/assets/home.json": "23e9de75af567768d8ec6f7f054ae1cb",
"assets/lib/assets/home_brands.json": "2d8e5721d0f5f3a9605275c6ecf4e04d",
"assets/lib/assets/images/bani_logo.png": "6063d94a923d8d2062451269fc9e1c39",
"assets/lib/assets/images/down_chevron.png": "40092079c931dd2b8145c1e70cb2fc9d",
"assets/lib/assets/images/ic_empty_like.png": "ce7295eb8cb2467df59f1b59a39fc3ff",
"assets/lib/assets/images/ic_filled_like.png": "2659a28f0ab5e93d175ae8cf2d305185",
"assets/lib/assets/images/left_arrow.png": "fa9e45f3b5b0778b155993c35cef27bf",
"assets/lib/assets/images/top_chevron.png": "292b89fbcf9798f92d00ad2dc3c4ed58",
"assets/lib/assets/product_suggestion.json": "0fc07120159e02fa46089c8f07c4bf79",
"assets/NOTICES": "5849e8c39d234c07dfe6df4aa18927d7",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"index.html": "b36a8cd9f07348bab558c5f64a87e4e5",
"/": "b36a8cd9f07348bab558c5f64a87e4e5",
"main.dart.js": "761154c18625988793b82c04962fa3fd",
"manifest.json": "853de1adc5f2749a0d6908128c272b62",
"version.json": "ab2000dc8f0069d653bfe4c389e18a1d"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}

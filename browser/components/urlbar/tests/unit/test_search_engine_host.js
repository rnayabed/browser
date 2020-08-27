/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

add_task(async function test_searchEngine_autoFill() {
  Services.prefs.setBoolPref("browser.urlbar.autoFill.searchEngines", true);
  Services.prefs.setBoolPref("browser.urlbar.suggest.searches", false);
  await Services.search.addEngineWithDetails("MySearchEngine", {
    method: "GET",
    template: "http://my.search.com/",
  });
  let engine = Services.search.getEngineByName("MySearchEngine");
  registerCleanupFunction(async () => {
    Services.prefs.clearUserPref("browser.urlbar.autoFill.searchEngines");
    Services.prefs.clearUserPref("browser.urlbar.suggest.searches");
    Services.search.removeEngine(engine);
  });

  // Add an uri that matches the search string with high frecency.
  let uri = Services.io.newURI("http://www.example.com/my/");
  let visits = [];
  for (let i = 0; i < 100; ++i) {
    visits.push({ uri, title: "Terms - SearchEngine Search" });
  }
  await PlacesTestUtils.addVisits(visits);
  await PlacesTestUtils.addBookmarkWithDetails({
    uri,
    title: "Example bookmark",
  });
  await PlacesTestUtils.promiseAsyncUpdates();
  ok(
    frecencyForUrl(uri) > 10000,
    "Added URI should have expected high frecency"
  );

  info(
    "Check search domain is autoFilled even if there's an higher frecency match"
  );
  let context = createContext("my", { isPrivate: false });
  await check_results({
    search: "my",
    autofilled: "my.search.com/",
    matches: [
      makePrioritySearchResult(context, {
        engineName: "MySearchEngine",
        heuristic: true,
      }),
    ],
  });

  await cleanupPlaces();
});

add_task(async function test_searchEngine_noautoFill() {
  await PlacesTestUtils.addVisits(
    Services.io.newURI("http://my.search.com/samplepage/")
  );

  info("Check search domain is not autoFilled if it matches a visited domain");
  let context = createContext("my", { isPrivate: false });
  await check_results({
    context,
    autofilled: "my.search.com/",
    completed: "http://my.search.com/",
    matches: [
      // Note this result is a normal Autofill result and not a priority engine.
      makeVisitResult(context, {
        uri: "http://my.search.com/",
        title: "my.search.com",
        heuristic: true,
      }),
      makeVisitResult(context, {
        uri: "http://my.search.com/samplepage/",
        title: "test visit for http://my.search.com/samplepage/",
        providerName: "UnifiedComplete",
      }),
    ],
  });

  await cleanupPlaces();
});

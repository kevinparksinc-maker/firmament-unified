const dailyPages = ["20260825", "20260823", "20260822"];
const base = "https://npb.jp/bis/eng/2026/games/";

for (const day of dailyPages) {
  const dailyHtml = await (await fetch(`${base}gm${day}.html`)).text();
  const links = [...dailyHtml.matchAll(/href="(?:[^\"]*\/)?(s\d+\.html)"/g)].map(match => match[1]);
  console.log(`\n${day}: ${links.length} official game records`);
  for (const link of [...new Set(links)]) {
    const detail = await (await fetch(`${base}${link}`)).text();
    const title = detail.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim();
    const start = detail.match(/\(\s*(\d{1,2}:\d{2})\s*-/)?.[1] ?? "NOT FOUND";
    const venue = detail.match(/class="gameinfo"[\s\S]*?<td[^>]*>([^<]+)<\/td>/i)?.[1]?.trim() ?? "CHECK DETAIL";
    console.log(`${link}\t${start}\t${title}\t${venue}`);
  }
}

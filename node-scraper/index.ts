import { launch } from 'puppeteer';
import { writeFileSync } from 'fs';
import { Scraper } from "./scrapers/scraper";
import { SproutScraper } from "./scrapers/sprout.mjs";
import { LuciferScraper } from './scrapers/lucifer.mjs';

const scrapers: Array<Scraper> = [
  new SproutScraper(),
  new LuciferScraper()
];

async function crawl() {
  const browser = await launch({ headless: true });

  const data = scrapers.map(async scraper => {
    const products = await scraper.scrape(browser);
  
    return {
      name: scraper.name,
      products: products
    };
  });
  
  Promise.all(data).then(data => {
    writeFileSync('data/products.json', JSON.stringify(data));
    browser.close();
  }).catch(error => {
    console.error(error);
    browser.close();
  });
}

await crawl();

import { launch } from 'puppeteer';
import { writeFileSync, copyFileSync, readFileSync } from 'fs';
import { Scraper } from "./scrapers/scraper";
import { SproutScraper } from "./scrapers/sprout.mjs";
import { LuciferScraper } from './scrapers/lucifer.mjs';
import { BeanBrothersScraper } from './scrapers/beanbrothers.mjs';
import bunyan from 'bunyan';
import { CoffeeProduct } from './types/coffee-product';

const productLocation = 'data/products.json';
const oldLocation = 'data/products-old.json';

const log = bunyan.createLogger({
  name: 'coffee-scraper',
  streams: [
    {
      level: 'debug',
      stream: process.stdout
    },
    {
      level: 'trace',
      path: `./logs/crawl-log-${Date.now()}.json`
    }
  ]
});

const scrapers: Array<Scraper> = [
  new SproutScraper(),
  new LuciferScraper(),
  new BeanBrothersScraper()
];

/**
 * Crawl using all existing scrapers, outputting the results to a new products.json
 */
async function crawl() {
  log.info('Starting crawl');
  log.debug(`Using ${scrapers.length} scrapers: `)
  log.debug(scrapers.map(it => it.name));

  const browser = await launch({ headless: true });

  const data = scrapers.map(async scraper => {
    const products = await scraper.scrape(browser);

    return {
      name: scraper.name,
      products: products
    };
  });

  Promise.all(data).then(data => {
    writeFileSync(productLocation, JSON.stringify(data, null, 2));
    browser.close();
  }).catch(error => {
    console.error(error);
    browser.close();
  });
}

/**
 * Compare the previous crawl results to the current crawl results to generate a mutation object
 * Used for detecting crawler errors (empty results etc.) and new product detection.
 */
async function compare() {
  const getProducts = (fileName: string) => {
    const data = JSON.parse(readFileSync(fileName).toString()) as Array<{ name: string, products: Array<CoffeeProduct> }>;
    return { data: data, products: data.flatMap(scrapers => scrapers.products.map(product => product.link)) };
  }

  const { data: newData, products: newProducts } = getProducts(productLocation);
  const { products: oldProducts } = getProducts(oldLocation);

  log.info(`Scraped a total of ${newProducts.length} products`);

  // Detect added and remove producst
  const removedProducts = oldProducts.filter(product => !newProducts.find(it => it === product));
  const addedProducts = newProducts.filter(product => !oldProducts.find(it => it === product));

  if (removedProducts.length > 0) {
    log.info(`Removed total of ${removedProducts.length} products`);
    removedProducts.forEach(product => log.info(`Removed product ${product}`));
  }

  if (addedProducts.length > 0) {
    log.info(`Added total of ${addedProducts.length} products`);
    addedProducts.forEach(product => log.info(`Added product ${product}`));
  }

  // Detect empty data sets
  newData.forEach(scraper => scraper.products.length === 0 ? log.error(`${scraper.name} has empty product set!`) : null);
}

/**
 * Run an entire refresh, crawling all products and comparing the results.
 */
async function run() {
  copyFileSync(productLocation, oldLocation);
  await crawl();
  await compare();
}

await run();

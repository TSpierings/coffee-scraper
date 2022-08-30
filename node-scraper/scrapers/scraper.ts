import { Browser } from "puppeteer";
import { CoffeeProduct } from "../types/coffee-product";

export interface Scraper {
  name: string;
  scrape(browser: Browser): Promise<Array<CoffeeProduct>>;
}
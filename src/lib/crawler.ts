import * as cheerio from 'cheerio';
import Crawler, { CrawlerRequestResponse } from 'crawler';
import { stderr } from 'node:process';
import resolveURL from '../utils/resolveURL.js';

// import TurndownService from 'turndown';

// const turndownService = new TurndownService();

type ProgressCallback = (linksFound: number, linksCrawled: number, currentUrl: string) => void;

interface Page {
  url: string;
  text: string;
  title: string;
}

/* The WebCrawler class is a TypeScript implementation of a web crawler that can extract text from web
pages and follow links to crawl more pages. */
class WebCrawler {
  pages: Page[];

  limit: number;

  urls: string[];

  count: number;

  textLengthMinimum: number;

  selector: string;

  progressCallback: ProgressCallback;

  crawler: Crawler;

  constructor(
    urls: string[],
    progressCallback: ProgressCallback,
    selector = 'body',
    limit = 20,
    textLengthMinimum = 200
  ) {
    this.urls = urls;
    this.selector = selector;
    this.limit = limit;
    this.textLengthMinimum = textLengthMinimum;
    this.progressCallback = progressCallback;
    this.count = 0;
    this.pages = [];
    this.crawler = new Crawler({
      maxConnections: 10,
      callback: this.handleRequest,
      userAgent: 'node-crawler',
    });
  }

  /* `handleRequest` is a method that handles the response of a web page request made by the `crawler`
object. It takes in three parameters: `error`, `res`, and `done`. */
  handleRequest = (error: Error | null, res: CrawlerRequestResponse, done: () => void) => {
    if (error) {
      stderr.write(error.message);
      done();
      return;
    }

    const $ = cheerio.load(res.body);
    // Remove obviously superfluous elements
    $('script').remove();
    $('header').remove();
    $('nav').remove();
    $('style').remove();
    $('img').remove();
    $('svg').remove();
    const title = $('title').text() || '';
    const text = $(this.selector).text();
    // const text = turndownService.turndown(html || '');

    const page: Page = {
      url: res.request.uri.href,
      text,
      title,
    };
    if (text.length > this.textLengthMinimum) {
      this.pages.push(page);
      this.progressCallback(this.count + 1, this.pages.length, res.request.uri.href);
    }

    $('a').each((_i: number, elem: cheerio.Element) => {
      if (this.count >= this.limit) {
        return false; // Stop iterating once the limit is reached
      }

      const href = $(elem).attr('href')?.split('#')[0];
      const uri = res.request.uri.href;
      const url = href && resolveURL(uri, href);
      // crawl more
      if (url && this.urls.some((u) => url.includes(u))) {
        this.crawler.queue(url);
        this.count += 1;
      }
      return true; // Continue iterating when the limit is not reached
    });

    done();
  };

  start = async () => {
    this.pages = [];
    return new Promise((resolve) => {
      this.crawler.on('drain', () => {
        resolve(this.pages);
      });
      this.urls.forEach((url) => {
        this.crawler.queue(url);
      });
    });
  };
}

export default WebCrawler;

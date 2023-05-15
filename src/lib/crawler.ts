// @ts-ignore
import Spider from 'node-spider';
// @ts-ignore
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';

const turndownService = new TurndownService();

class Crawler {
  pages: Page[] = [];

  limit = 20;

  urls: string[] = [];

  spider: Spider | null = {};

  count = 0;

  textLengthMinimum = 200;

  constructor(urls: string[], limit = 20, textLengthMinimum = 200) {
    this.urls = urls;
    this.limit = limit;
    this.textLengthMinimum = textLengthMinimum;

    this.count = 0;
    this.pages = [];
    this.spider = {};
  }

  handleRequest = (doc: any) => {
    const $ = cheerio.load(doc.res.body);
    // Remove obviously superfulous elements
    $('script').remove();
    $('header').remove();
    $('nav').remove();
    const title = $('title').text() || '';
    const html = $('body').html();
    const text = turndownService.turndown(html || '');

    const page: Page = {
      url: doc.url,
      text,
      title,
    };
    if (text.length > this.textLengthMinimum) {
      this.pages.push(page);
    }

    doc.$('a').each((_i: number, elem: any) => {
      const href = doc.$(elem).attr('href')?.split('#')[0];
      const url = href && doc.resolve(href);
      // crawl more
      if (url && this.urls.some((u) => url.includes(u)) && this.count < this.limit) {
        this.spider.queue(url, this.handleRequest);
        this.count += 1;
      }
    });
  };

  start = async () => {
    this.pages = [];
    return new Promise((resolve, reject) => {
      this.spider = new Spider({
        concurrent: 5,
        delay: 0,
        allowDuplicates: false,
        catchErrors: true,
        addReferrer: false,
        xhr: false,
        keepAlive: false,
        error: (err: any, url: string) => {
          console.log(err, url);
          reject(err);
        },
        // Called when there are no more requests
        done: () => {
          resolve(this.pages);
        },
        headers: { 'user-agent': 'node-spider' },
        encoding: 'utf8',
      });
      this.urls.forEach((url) => {
        this.spider.queue(url, this.handleRequest);
      });
    });
  };
}

export { Crawler };

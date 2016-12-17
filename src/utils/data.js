import parseCsv from 'csv-parse/lib/sync';
import { first, uniq } from 'lodash';

export const DataColumns = {
  Year: 0,
  Ratings: 1
};

export const RatingsColumns = {
  Bank: 0,
  Total: 1,
  Others: 2
};

const dataRequire = require.context('../data', false, /.*\.csv$/);
const DataUrls = dataRequire.keys().reduce((result, item) => {
  result[item.slice(2, -4)] = dataRequire(item);
  return result;
}, {});

let cachedDataSet = null;

const fetchData = async url => (
  fetch(url).then(result => (
    result.text()
  ))
);

export const getDataSet = async () => {
  if (cachedDataSet) {
    return cachedDataSet;
  }
  cachedDataSet = [];
  for (const [key, url] of Object.entries(DataUrls)) {
    const csvData = await fetchData(url);
    cachedDataSet.push([key, parseCsv(csvData)]);
  }
  return cachedDataSet;
};

export const getAllBanks = () => {
  const banksPerYear = cachedDataSet.map(row => (
    row[DataColumns.Ratings]
  )).map(rows => (
    rows.slice(1).map(ratingRow => (
      ratingRow[RatingsColumns.Bank]
    ))
  ));
  const uniqBanks = uniq(...banksPerYear);
  uniqBanks.sort();
  return uniqBanks;
};

export const getRatingColumns = () => (
  first(first(cachedDataSet)[DataColumns.Ratings])
    .slice(RatingsColumns.Others)
);

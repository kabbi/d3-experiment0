import * as d3 from 'd3';
import memoize from 'lodash/memoize';

import { DataColumns } from '../utils/data';

const getDimensionsAndScales = (selector, appState) => {
  const svg = selector.node();
  const columnIndex = selector.datum();
  const small = columnIndex !== 0;

  const margin = {
    top: small ? 10 : 20,
    right: small ? 10 : 0,
    bottom: small ? 10 : 20,
    left: small ? 10 : 20,
  };

  const svgRect = svg.getBoundingClientRect();
  const width = svgRect.width - margin.left - margin.right;
  const height = svgRect.height - margin.top - margin.bottom;

  const x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.15)
    .domain(appState.dataSet.map(row => row[DataColumns.Year]));
  const y = d3.scaleLinear()
    .rangeRound([0, height])
    .domain([6, 0]);

  return {
    svg,
    columnIndex,
    small,
    margin,
    width,
    height,
    x, y
  };
};

export default memoize(getDimensionsAndScales, selector => (
  `${selector.datum()}`
));

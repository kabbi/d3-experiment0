import * as d3 from 'd3';
import { keyBy } from 'lodash';

import { DataColumns } from './utils/data';

const ColumnCount = 4;
const DefaultCellOpacity = 0.2;

export const makeChart = options => {
  const { dataSet, selector, columnIndex, small, index } = options;
  const margin = small ? 10 : 20;

  const svg = selector.append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .append('svg:g')
    .attr('transform', `translate(${margin},${margin})`);

  const { clientWidth, clientHeight } = svg.node().parentNode;
  const width = clientWidth - 2 * margin;
  const height = clientHeight - 2 * margin;

  const x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.1)
    .domain(dataSet.map(row => row[DataColumns.Year]));
  const yMargin = small ? 10 : 30;
  const y = d3.scaleLinear()
    .rangeRound([yMargin, height - yMargin])
    .domain([5, 1]);

  if (!small) {
    const xAxis = d3.axisBottom(x);
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);
  }

  let yAxisPosition = small ? null : 'Left';
  if (small && index % ColumnCount === 0) {
    yAxisPosition = 'Left';
  }
  if (small && (index + 1) % ColumnCount === 0) {
    yAxisPosition = 'Right';
  }
  if (yAxisPosition) {
    const yAxis = d3[`axis${yAxisPosition}`](y)
      .ticks(5);
    if (small) {
      yAxis.tickSize(0);
    }
    const axis = svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);
    if (small && yAxisPosition === 'Right') {
      axis.attr('transform', `translate(${width},0)`);
    }
  }

  svg.append('g')
    .attr('class', 'data-area')
    .selectAll('g')
    .data(dataSet)
    .enter().append('g')
    .attr('class', 'data-column')
      .attr('transform', data => (
        `translate(${x(data[DataColumns.Year])},0)`
      ))
      .selectAll('rect')
      .data(data => (
        data[DataColumns.Ratings].slice(1)
      ))
      .enter().append('rect')
        .attr('y', data => y(data[columnIndex]))
        .attr('width', x.bandwidth())
        .attr('height', small ? 1.5 : 2)
        .style('opacity', DefaultCellOpacity)
        .attr('class', 'data-cell');

  const findMaxElement = comparator => {
    let maxItem = null;
    for (const dataRow of dataSet) {
      for (const ratingsRow of dataRow[DataColumns.Ratings].slice(1)) {
        const value = ratingsRow[columnIndex];
        if (!maxItem || !comparator(maxItem.y, value)) {
          maxItem = { x: dataRow[DataColumns.Year], y: value };
        }
      }
    }
    return maxItem;
  };

  const maxValue = findMaxElement((a, b) => a > b);
  const minValue = findMaxElement((a, b) => a < b);
  const extremaOffset = small ? 5 : 15;
  const extremaShift = small ? '0' : '0.6em';

  svg.append('text')
    .attr('x', x(maxValue.x))
    .attr('y', y(maxValue.y) - extremaOffset)
    .attr('dx', extremaShift)
    .attr('class', 'extrema')
    .text(maxValue.y);
  svg.append('text')
    .attr('x', x(minValue.x))
    .attr('y', y(minValue.y) + extremaOffset)
    .attr('dx', extremaShift)
    .attr('class', 'extrema')
    .text(minValue.y);
};

export const updateChart = options => {
  const { selector, selection } = options;
  const selectionByIndex = keyBy(selection, 'index');
  const hasSelection = selection.length !== 0;

  selector.select('.data-area')
    .selectAll('.data-column')
      .selectAll('.data-cell')
      .style('opacity', (_, index) => {
        const selected = selectionByIndex[index];
        if (!hasSelection) {
          return DefaultCellOpacity;
        }
        return selected ? 0.8 : 0.05;
      })
      .style('fill', (_, index) => {
        const selected = selectionByIndex[index];
        return selected ? selected.color : 'black';
      });
};

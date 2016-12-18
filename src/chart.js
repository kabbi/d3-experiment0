import * as d3 from 'd3';
import { keyBy, maxBy, minBy, throttle, identity } from 'lodash';

import { DataColumns, RatingsColumns } from './utils/data';

const ColumnCount = 4;
const DefaultCellOpacity = 0.2;
const TooltipOffset = 10;

export const renderTooltip = throttle((event, column, columnIndex, selection) => {
  const { pageX, pageY } = event;
  const data = column ? [{ column, columnIndex }] : [];
  const updateTooltip = tooltip => {
    tooltip
      .style('left', `${pageX + TooltipOffset}px`)
      .style('top', `${pageY + TooltipOffset}px`);
  };
  const tooltip = d3.select('.tooltip-container')
    .selectAll('.tooltip')
    .data(data, data => (
      `${data.column[DataColumns.Year]}-${data.columnIndex}`
    ))
    .call(updateTooltip);
  const enter = tooltip.enter().append('div')
    .attr('class', 'tooltip');
  enter.append('small')
    .attr('class', 'tooltip-row-header')
    .text('Средняя оценка');
  const averageRow = enter.append('div')
    .attr('class', 'tooltip-row __big');
  averageRow.append('div')
    .attr('class', 'tooltip-row-value')
    .text(data => data.column[DataColumns.Year]);
  averageRow.append('div')
    .attr('class', 'tooltip-row-value')
    .text(data => (
      d3.mean(data.column[DataColumns.Ratings].slice(1), row => (
        row[data.columnIndex]
      )).toFixed(2)
    ));

  const extrema = (data, predicate) => (
    predicate(data.column[DataColumns.Ratings].slice(1), row => (
      row[data.columnIndex]
    ))
  );

  enter.append('small')
    .attr('class', 'tooltip-row-header')
    .text('Лучший');
  const bestRow = enter.append('div')
    .attr('class', 'tooltip-row c-best');
  bestRow.append('div')
    .attr('class', 'tooltip-row-value')
    .text(data => extrema(data, maxBy)[RatingsColumns.Bank]);
  bestRow.append('div')
    .attr('class', 'tooltip-row-value')
    .text(data => extrema(data, maxBy)[data.columnIndex]);

  enter.append('small')
    .attr('class', 'tooltip-row-header')
    .text('Хучший');
  const worstRow = enter.append('div')
    .attr('class', 'tooltip-row c-worst');
  worstRow.append('div')
    .attr('class', 'tooltip-row-value')
    .text(data => extrema(data, minBy)[RatingsColumns.Bank]);
  worstRow.append('div')
    .attr('class', 'tooltip-row-value')
    .text(data => extrema(data, minBy)[data.columnIndex]);

  if (selection && selection.length !== 0) {
    enter.append('hr');
    for (const item of selection) {
      const selected = data => (
        data.column[DataColumns.Ratings].find(row => (
          row[RatingsColumns.Bank] === item.value
        ))
      );
      const optional = (value, formatter = identity) => (
        value ? formatter(value) : 'н/д'
      );
      const selectionRow = enter.append('div')
        .attr('class', 'tooltip-row')
        .style('color', item.color);
      selectionRow.append('div')
        .attr('class', 'tooltip-row-value')
        .text(item.value);
      selectionRow.append('div')
        .attr('class', 'tooltip-row-value')
        .text(data => {
          const row = selected(data);
          return row ? row[data.columnIndex] : 'н/д';
        });
    }
  }

  enter.call(updateTooltip);
  tooltip.exit().remove();
}, 100);

export const makeChart = options => {
  const { dataSet, selector, columnIndex, small, index } = options;
  const margin = small ? 10 : 20;

  const svg = selector.append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .append('svg:g')
    .attr('transform', `translate(${margin},${margin})`);

  const svgRect = svg.node().parentNode.getBoundingClientRect();
  const width = svgRect.width - 2 * margin;
  const height = svgRect.height - 2 * margin;

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
      .selectAll('rect.data-cell')
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

  svg.selectAll('.data-column')
    .append('rect')
    .attr('class', 'highlight')
    .attr('width', x.bandwidth())
    .attr('height', height)
    .attr('x', 0)
    .attr('y', 0)
    .on('mousemove', column => {
      renderTooltip(d3.event, column, columnIndex, options.selection);
    })
    .on('mouseleave', () => {
      renderTooltip(d3.event);
    });
};

export const updateChart = options => {
  const { selector, selection } = options;
  const selectionByBank = keyBy(selection, 'value');
  const hasSelection = selection.length !== 0;

  selector.selectAll('.data-column')
    .selectAll('.data-cell')
    .style('opacity', row => {
      const selected = selectionByBank[row[RatingsColumns.Bank]];
      if (!hasSelection) {
        return DefaultCellOpacity;
      }
      return selected ? 0.8 : 0.02;
    })
    .style('fill', row => {
      const selected = selectionByBank[row[RatingsColumns.Bank]];
      return selected ? selected.color : 'black';
    });
};

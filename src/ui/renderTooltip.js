import * as d3 from 'd3';

import { DataColumns, RatingsColumns, RatingColumnOffset }
  from '../utils/data';

const TooltipOffset = 10;

export default (appState, hovered, column, columnIndex) => {
  const { pageX, pageY } = d3.event;
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
    .classed('tooltip', true);
  const statsRow = enter.append('div')
    .classed('tooltip-element tooltip-element__stats', true);
  statsRow.append('div')
    .classed('tooltip-row__value', true)
    .text(data => data.column[DataColumns.Year]);

  const appendStatsColumn = (label, calculate) => {
    const maxColumn = statsRow.append('div')
      .classed('tooltip-row__column', true)
      .text(label);
    maxColumn.append('br')
      .lower();
    maxColumn.append('strong')
      .text(data => (
        calculate(data.column[DataColumns.Ratings].slice(1), row => (
          +row[data.columnIndex + RatingColumnOffset]
        )).toFixed(2)
      ))
      .lower();
  };

  appendStatsColumn('Макс.', d3.max);
  appendStatsColumn('Мин.', d3.min);
  appendStatsColumn('Средн.', d3.mean);

  const selection = hovered
    ? [...appState.selection, hovered]
    : appState.selection;
  for (const item of selection) {
    const selected = data => (
      data.column[DataColumns.Ratings].find(row => (
        row[RatingsColumns.Bank] === item.value
      ))
    );
    enter.append('hr');
    const selectionRow = enter.append('div')
      .classed('tooltip-element tooltip-element__info', true)
      .style('color', item.color);
    selectionRow.append('div')
      .text(item.value);
    selectionRow.append('div')
      .text(data => {
        const row = selected(data);
        return row ? row[data.columnIndex + RatingColumnOffset] : 'н/д';
      });
  }

  enter.call(updateTooltip);

  tooltip.exit()
    .remove();
};

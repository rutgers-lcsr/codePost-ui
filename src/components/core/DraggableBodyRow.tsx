import * as React from 'react';

import { DndProvider, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import update from 'immutability-helper';

let draggingIndex = -1;

class BodyRow extends React.Component {
  render() {
    // @ts-ignore
    const { isOver, connectDragSource, connectDropTarget, moveRow, ...restProps } = this.props;
    // @ts-ignore
    const style = { ...restProps.style, cursor: 'move' };

    // @ts-ignore
    let { className } = restProps;
    if (isOver) {
      // @ts-ignore
      if (restProps.index > draggingIndex) {
        className += ' drop-over-downward';
      }
      // @ts-ignore
      if (restProps.index < draggingIndex) {
        className += ' drop-over-upward';
      }
    }

    return connectDragSource(connectDropTarget(<tr {...restProps} className={className} style={style} />));
  }
}

const rowSource = {
  beginDrag(props: any) {
    draggingIndex = props.index;
    return {
      index: props.index,
    };
  },
};

const rowTarget = {
  drop(props: any, monitor: any) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Time to actually perform the action
    props.moveRow(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  },
};

const DraggableBodyRow = DropTarget('row', rowTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
}))(
  DragSource('row', rowSource, (connect) => ({
    connectDragSource: connect.dragSource(),
  }))(BodyRow),
);

export default DraggableBodyRow;

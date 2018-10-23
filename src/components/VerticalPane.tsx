import * as React from 'react';
import Select from 'react-select';
import { IOption } from '../types/common'


interface IProps {
  currentTab?: IOption,
  currentSelector?: IOption,
  items: any[],
  handleTabChange: (option: IOption, event: any) => void,
  handleSelectorChange: (option: IOption) => void
}

const VerticalPane = (props: IProps) => {
  const { currentTab, currentSelector, items } = props;
  const { handleSelectorChange, handleTabChange } = props;
  const isLoading = items.length === 0

  const options = items.map((item, i) => (
    {'value': item.id, 'label': item.name}
  ));

  let tabs = items.filter((obj: any) => {
    return currentSelector && obj.id === currentSelector.value;
  });
  tabs = tabs.length > 0 ? tabs[0].assignments : []
  tabs = tabs.map((item, i) => (
    {'value': item.id, 'label': item.name}
  ));

  return (
    <div>
      <Select
        isLoading={isLoading}
        value={currentSelector}
        options={options}
        onChange={handleSelectorChange}
      />
      <VerticalTabs
        currentItem={currentTab}
        items={tabs}
        handleTabChange={handleTabChange}
      />
    </div>
  );
}

interface ITabProps {
  label: string,
  value: number | string,
  onClick: any
}

const Tab = (props: ITabProps) => {
  return (
    <li
      onClick={props.onClick}
      key={props.value}
    >
      {props.label}
    </li>
  )
}

interface IVerticalTabsProps {
  currentItem?: IOption,
  items: IOption[],
  handleTabChange: (option: IOption, event: any) => void
}

const VerticalTabs = (props: IVerticalTabsProps) => {
  return (
    <ul>
      {props.items.map((item: any, i: number) => {
        const label = item.label + ' current: ' + (props.currentItem ? props.currentItem.label : '--');
        return (
          <Tab
            label={label}
            value={item.value}
            key={item.value}
            onClick={props.handleTabChange.bind(props, item)}
          />
         )
       })}
    </ul>
  )
}

export default VerticalPane;
import * as React from 'react';
import Select from 'react-select';
import { IOption } from '../types/common'


interface IProps {
  currentTab?: IOption,
  currentSelector?: IOption,
  selectorItems: any[],
  tabItems: any[],
  handleTabChange: (option: IOption, event: any) => void,
  handleSelectorChange: (option: IOption) => void
}

const VerticalPane = (props: IProps) => {
  const { currentTab, currentSelector, selectorItems, tabItems } = props;
  const { handleSelectorChange, handleTabChange } = props;
  const isLoading = selectorItems.length === 0

  return (
    <div>
      <Select
        isLoading={isLoading}
        value={currentSelector}
        options={selectorItems}
        onChange={handleSelectorChange}
      />
      <VerticalTabs
        currentItem={currentTab}
        items={tabItems}
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
import * as React from 'react';
import Select from 'react-select';
import '../styles/VerticalPane.scss';
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
    <div className="vertical-pane-container">
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
  key: number,
  selected: boolean,
  onClick: any
}

const Tab = (props: ITabProps) => {
  const className = props.selected ? 'vertical-pane-tab selected' : 'vertical-pane-tab'
  return (
    <li
      onClick={props.onClick}
      key={props.value}
      className={className}
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
    <ul className='vertical-pane'>
      {props.items.map((item: any, i: number) => {
        const currentLabel = props.currentItem ? props.currentItem.label : '--'
        const selected = item.label === currentLabel;
        return (
          <Tab
            selected={selected}
            label={item.label}
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